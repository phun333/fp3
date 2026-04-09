import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
app = FastAPI(
    title="FP3 AI Tag Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================
# Pydantic Models
# ==================
class ExtractTagsRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=10000)
    top_n: int = Field(default=5, ge=1, le=20)


class AnalyzeProfileRequest(BaseModel):
    bio: str = Field(..., min_length=10, max_length=5000)
    publications: list[str] = Field(default=[])


class SuggestedTag(BaseModel):
    tag_id: str
    tag_name: str
    category: Optional[str] = None
    confidence: float


class ExtractTagsResponse(BaseModel):
    suggested_tags: list[SuggestedTag]
    keywords: list[str]


class AnalyzeProfileResponse(BaseModel):
    suggested_tags: list[SuggestedTag]
    research_areas: list[str]
    keywords: list[str]


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


def match_tags(text: str, top_n: int = 5, threshold: float = 0.4) -> list[SuggestedTag]:
    """Metin embedding'ini tag embedding'leriyle eşleştir"""
    if not model or tag_embeddings is None or len(tag_cache) == 0:
        return []

    text_embedding = model.encode([text], convert_to_numpy=True)

    # Cosine similarity
    similarities = np.dot(tag_embeddings, text_embedding.T).flatten()

    # Threshold üzerindeki tag'leri al
    results = []
    for idx, score in enumerate(similarities):
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

    # Skora göre sırala ve top_n kadar döndür
    results.sort(key=lambda x: x.confidence, reverse=True)
    return results[:top_n]


# ==================
# Endpoints
# ==================
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "tags_loaded": len(tag_cache),
    }


@app.get("/api/ai/health")
async def ai_health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "tags_loaded": len(tag_cache),
    }


@app.post("/api/ai/extract-tags", response_model=ExtractTagsResponse)
async def extract_tags(req: ExtractTagsRequest):
    """Metin'den tag önerisi çıkar"""
    if not model or not kw_model:
        raise HTTPException(status_code=503, detail="Model henüz yüklenmedi")

    # 1. KeyBERT ile keyword çıkar
    keywords = extract_keywords(req.text, top_n=10)

    # 2. Metin + keyword'leri birleştirerek tag eşleştir
    combined = req.text + " " + " ".join(keywords)
    suggested_tags = match_tags(combined, top_n=req.top_n)

    return ExtractTagsResponse(
        suggested_tags=suggested_tags,
        keywords=keywords,
    )


@app.post("/api/ai/analyze-profile", response_model=AnalyzeProfileResponse)
async def analyze_profile(req: AnalyzeProfileRequest):
    """Profil bilgilerinden tag ve araştırma alanı öner"""
    if not model or not kw_model:
        raise HTTPException(status_code=503, detail="Model henüz yüklenmedi")

    # Tüm metinleri birleştir
    texts = [req.bio] + req.publications
    combined_text = " ".join(texts)

    # Keyword çıkar
    keywords = extract_keywords(combined_text, top_n=15)

    # Tag eşleştir
    suggested_tags = match_tags(combined_text, top_n=10)

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


@app.post("/api/ai/reload-tags")
async def reload_tags():
    """Tag cache'ini yenile"""
    load_tags_from_db()
    return {
        "success": True,
        "message": f"{len(tag_cache)} tag yeniden yüklendi",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)
