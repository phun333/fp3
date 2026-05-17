import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
import numpy as np

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================
# Global State
# ==================
model: Optional[SentenceTransformer] = None
kw_model: Optional[KeyBERT] = None
tag_cache: list[dict] = []
tag_embeddings: Optional[np.ndarray] = None


def load_models():
    """Model yükleme (all-MiniLM-L6-v2 — hızlı, hafif, yeterli)"""
    global model, kw_model
    logger.info("🔄 Modeller yükleniyor...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    kw_model = KeyBERT(model=model)
    logger.info("✅ Modeller yüklendi")


def load_tags_from_db():
    """PostgreSQL'den tag'leri çek ve embedding'lerini hesapla"""
    global tag_cache, tag_embeddings

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        logger.warning("⚠️ DATABASE_URL tanımlı değil, tag cache boş kalacak")
        return

    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute('SELECT id, name, category FROM "Tag" ORDER BY name')
        rows = cur.fetchall()
        cur.close()
        conn.close()

        tag_cache = [
            {"id": row[0], "name": row[1], "category": row[2]} for row in rows
        ]

        if tag_cache and model:
            tag_names = [t["name"] for t in tag_cache]
            tag_embeddings = model.encode(tag_names, convert_to_numpy=True)

        logger.info(f"✅ {len(tag_cache)} tag yüklendi ve embedding'leri hesaplandı")
    except Exception as e:
        logger.error(f"❌ Tag yükleme hatası: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: model + tag yükle"""
    load_models()
    load_tags_from_db()
    yield


# ==================
# FastAPI App
# ==================
AI_API_DESCRIPTION = """
FP3 platformunun semantik tag öneri servisi.

**Mimari**
- Bu servis FP3'ün AI katmanıdır ve genelde Fastify API (`localhost:3001`)
  tarafından proxy edilir. UI'dan doğrudan çağrılmaz.
- [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) embedding modeli
- [`KeyBERT`](https://github.com/MaartenGr/KeyBERT) keyword çıkarımı için

**Algoritma**
1. KeyBERT ile metinden anahtar kelimeler çıkarılır
2. Metin + her keyword ayrı ayrı embed edilir
3. Postgres'ten cache'lenmiş tag embedding'leri ile cosine similarity hesaplanır
4. Tag başına maksimum benzerlik alınır (ortalama yerine, spesifik keyword'leri yakalamak için)
5. `confidence >= 0.35` olanlar dönülür

**Port**: 3002 (FP3 port standardı; `apps/api/.env` üzerinden `AI_SERVICE_URL` ile baġlıdır).
"""

tags_metadata = [
    {
        "name": "Sistem",
        "description": "Sağlık kontrolü, model durumu, cache yönetimi.",
    },
    {
        "name": "AI",
        "description": "Tag öneri ve profil analizi servisleri.",
    },
]

app = FastAPI(
    title="FP3 AI Service",
    description=AI_API_DESCRIPTION,
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=tags_metadata,
    docs_url=None,           # default Swagger UI'ı kapat
    redoc_url="/redoc",      # ReDoc'a sağlam yedek
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Fastify API ile aynı "Scalar" tarzı docs UI — /docs altında servis edilir
SCALAR_HTML = """<!doctype html>
<html>
  <head>
    <title>FP3 AI Service — API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script>
      var configuration = { theme: 'purple', layout: 'modern' };
      document.getElementById('api-reference').dataset.configuration = JSON.stringify(configuration);
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>"""


@app.get("/docs", include_in_schema=False, response_class=HTMLResponse)
async def scalar_docs():
    return HTMLResponse(SCALAR_HTML)


# ==================
# Pydantic Models
# ==================
class ExtractTagsRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=10,
        max_length=10000,
        description="Tag önerisi üretilecek metin (proje açıklaması, makale özeti, bio vb).",
        examples=["Transformer-based NLP for Turkish sentiment analysis"],
    )
    top_n: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Döndürülecek maksimum tag sayısı.",
    )


class AnalyzeProfileRequest(BaseModel):
    bio: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Kullanıcı biyografisi.",
    )
    publications: list[str] = Field(
        default=[],
        description="Opsiyonel: yayın başlık/özet listesi (ek baġlam için).",
    )


class SuggestedTag(BaseModel):
    tag_id: str = Field(..., description="Postgres'teki Tag.id")
    tag_name: str = Field(..., description="Tag görünen adı")
    category: Optional[str] = Field(None, description="Tag kategorisi (AI/ML, Web, ...)")
    confidence: float = Field(
        ...,
        ge=0,
        le=1,
        description="Cosine similarity skoru (0–1).  >=0.7 güçlü, 0.55–0.7 orta, <0.55 zayıf.",
    )


class ExtractTagsResponse(BaseModel):
    suggested_tags: list[SuggestedTag]
    keywords: list[str] = Field(
        ...,
        description="KeyBERT tarafından çıkarılan ham keyword'ler (debug/görünürlük için).",
    )


class AnalyzeProfileResponse(BaseModel):
    suggested_tags: list[SuggestedTag]
    research_areas: list[str] = Field(
        ...,
        description="Önerilen tag'lerin kategorilerinden türetilen araştırma alanı özeti.",
    )
    keywords: list[str]


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["ok"])
    model_loaded: bool
    tags_loaded: int = Field(..., description="Cache'te bulunan tag sayısı.")


class ReloadTagsResponse(BaseModel):
    success: bool
    message: str


# ==================
# Helper Functions
# ==================
def extract_keywords(text: str, top_n: int = 10) -> list[str]:
    """KeyBERT ile keyword çıkar"""
    if not kw_model:
        return []

    keywords = kw_model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 3),
        stop_words="english",
        top_n=top_n,
        use_mmr=True,
        diversity=0.5,
    )
    return [kw[0] for kw in keywords]


def match_tags(
    text: str,
    top_n: int = 5,
    threshold: float = 0.35,
    keywords: Optional[list[str]] = None,
) -> list[SuggestedTag]:
    """Metin (ve varsa keyword'ler) embedding'lerini tag embedding'leriyle
    eşleştir. Her tag için tüm sorguların maksimum benzerliğini alırız;
    böylece uzun bir açıklamada kısa keyword'lerle yakalanan özgül tag'ler
    de eşleşir (ortalama almak yerine en iyi sinyali tutarız)."""
    if not model or tag_embeddings is None or len(tag_cache) == 0:
        return []

    queries = [text]
    if keywords:
        # Sadece yeterli uzunluktaki anlamlı keyword'leri ekle
        queries.extend([k for k in keywords if len(k) >= 3])

    query_embeddings = model.encode(queries, convert_to_numpy=True)

    # Cosine similarity matrisi: (n_tags, n_queries)
    sim_matrix = np.dot(tag_embeddings, query_embeddings.T)
    # Her tag için queries üzerinden max benzerlik
    best_per_tag = sim_matrix.max(axis=1)

    results = []
    for idx, score in enumerate(best_per_tag):
        if score >= threshold:
            tag = tag_cache[idx]
            results.append(
                SuggestedTag(
                    tag_id=tag["id"],
                    tag_name=tag["name"],
                    category=tag["category"],
                    confidence=round(float(score), 3),
                )
            )

    results.sort(key=lambda x: x.confidence, reverse=True)
    return results[:top_n]


# ==================
# Endpoints
# ==================
@app.get(
    "/health",
    tags=["Sistem"],
    summary="Servis sağlık kontrolü",
    response_model=HealthResponse,
)
async def health():
    """Yküleme göstergesi (deploy/proxy health-check'leri için basit)."""
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "tags_loaded": len(tag_cache),
    }


@app.get(
    "/api/ai/health",
    tags=["Sistem"],
    summary="AI servisi sağlık durumu",
    response_model=HealthResponse,
)
async def ai_health():
    """Fastify API'nin proxy'lediġi sağlık endpoint'i. `/health` ile aynı çıktı."""
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "tags_loaded": len(tag_cache),
    }


@app.post(
    "/api/ai/extract-tags",
    tags=["AI"],
    summary="Metinden tag öner",
    response_model=ExtractTagsResponse,
    responses={
        503: {"description": "Model henüz hazır değil (startup tamamlanmadı)"},
    },
)
async def extract_tags(req: ExtractTagsRequest):
    """Verilen metinden semantik tag önerileri üretir.

    UI'da `AiTagSuggestions` component'i bu endpoint'i Fastify proxy'si
    (`POST /api/ai/suggest-tags`) üzerinden çağırır. Sahalar:

    - **Proje oluşturma** (`/projects/new`) → başlık + açıklama
    - **Yayın ekleme** (`/publications/new`) → başlık + özet
    - **Profil bio** (`/profile`) → bio (≥5 cmle/20 char)
    - **Ekip kurma wizard** (`/matching` — hoca) → fikir metni

    Çıktaki `confidence` skoru kullanıcıya **"Güçlü / Orta / Zayıf"** rozeti
    olarak gösterilir.
    """
    if not model or not kw_model:
        raise HTTPException(status_code=503, detail="Model henüz yüklenmedi")

    keywords = extract_keywords(req.text, top_n=10)
    suggested_tags = match_tags(req.text, top_n=req.top_n, keywords=keywords)

    return ExtractTagsResponse(
        suggested_tags=suggested_tags,
        keywords=keywords,
    )


@app.post(
    "/api/ai/analyze-profile",
    tags=["AI"],
    summary="Bio + yayın özetlerinden profil analizi",
    response_model=AnalyzeProfileResponse,
    responses={
        503: {"description": "Model henüz hazır değil"},
    },
)
async def analyze_profile(req: AnalyzeProfileRequest):
    """Bio + yayın listesi alıp **ilgi alanı önerisi + araştırma alanları** üretir.

    `/api/ai/extract-tags`'ten farkı:
    - Birden çok metni birleştirir (bio + publication özetleri)
    - Çıktıda `research_areas` (tag kategorilerinden türetilen ana araştırma
      alanları) da döner — profil sayfasında "Araştırma Alanlarınız" rozetleri
      için kullanılabilir.
    """
    if not model or not kw_model:
        raise HTTPException(status_code=503, detail="Model henüz yüklenmedi")

    # Tüm metinleri birleştir
    texts = [req.bio] + req.publications
    combined_text = " ".join(texts)

    # Keyword çıkar
    keywords = extract_keywords(combined_text, top_n=15)

    # Tag eşleştir (metin + keyword'ler kombine, tag başına max benzerlik)
    suggested_tags = match_tags(combined_text, top_n=10, keywords=keywords)

    # Araştırma alanları: en yüksek skorlu tag kategorilerini al
    areas: list[str] = []
    seen_categories: set[str] = set()
    for tag in suggested_tags:
        cat = tag.category or tag.tag_name
        if cat not in seen_categories:
            seen_categories.add(cat)
            areas.append(cat)
        if len(areas) >= 5:
            break

    return AnalyzeProfileResponse(
        suggested_tags=suggested_tags,
        research_areas=areas,
        keywords=keywords[:10],
    )


@app.post(
    "/api/ai/reload-tags",
    tags=["Sistem"],
    summary="Tag cache'i yenile",
    response_model=ReloadTagsResponse,
)
async def reload_tags():
    """DB'deki Tag tablosundan etiketleri yeniden okuyup embedding cache'ini günceller.

    Yeni tag eklendiyse (örn. admin paneli veya seed sonrası) bu çağrılmalı,
    yoksa AI önerileri stale tag listesi üzerinden çalışır.
    """
    load_tags_from_db()
    return {
        "success": True,
        "message": f"{len(tag_cache)} tag yeniden yüklendi",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3002"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
