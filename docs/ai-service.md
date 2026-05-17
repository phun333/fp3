# AI Servisi

FP3'ün AI katmanı tamamen **local ve ücretsiz**: harici API çağrısı yok,
LLM yok. Yalnızca **embedding tabanlı semantik arama** + KeyBERT ile
keyword çıkarımı.

## 🧠 Mimari

```
   Web/Mobile  →  /api/ai/suggest-tags  →  Fastify (proxy)
                                                │
                                                ▼
                              Python FastAPI :3002
                                                │
                                ┌──────────────┴──────────────┐
                                ▼                              ▼
                       sentence-transformers              KeyBERT
                       all-MiniLM-L6-v2                   (keyword extraction)
                                │
                                ▼
                       Postgres'ten tag listesi → tag_embeddings cache (RAM)
```

## 📦 Kullanılan Modeller

| Model | Boyut | Görev |
|-------|-------|-------|
| `sentence-transformers/all-MiniLM-L6-v2` | ~90 MB | Metin → 384-dim embedding |
| `KeyBERT` | (üstündekini kullanır) | Keyword/keyphrase çıkarımı |

İlk çalıştırmada model `~/.cache/huggingface` altına indirilir. Sonraki
çalıştırmalar cache'ten yükler, ~3 saniyede hazır.

Apple Silicon Mac'lerde `torch` otomatik **`mps`** (Metal) device'ı kullanır.

## ⚙️ Servisi Başlatma

```bash
# Root'tan
pnpm dev:ai

# veya manuel:
cd apps/ai-service
source .venv/bin/activate     # virtualenv (zaten oluşturulmuş)
python main.py
# Uvicorn :3002'de açılır, model + tag cache yüklenir
```

## 📖 API Dokümantasyonu

Fastify API ile **aynı görünüm**: Scalar API Reference UI.

| URL | Ne sunar? |
|-----|-----------|
| `http://localhost:3002/docs` | Scalar interaktif dokümantasyon |
| `http://localhost:3002/redoc` | ReDoc yedeġi |
| `http://localhost:3002/openapi.json` | OpenAPI 3 spec (CI/codegen) |

Tüm endpoint'ler **etiketli** (`Sistem`, `AI`), örnek istek/cevapları var,
Fastify API'nin Scalar UI'ı ile **tutarlı görünüm**. (`apps/ai-service/main.py`
içindeki `SCALAR_HTML` template.)

İlk açılışta loglar:
```
🔄 Modeller yükleniyor...
✓ sentence-transformers/all-MiniLM-L6-v2 hazır
✓ KeyBERT hazır
📌 35 tag yüklendi
```

### Environment

```env
# apps/ai-service/.env
DATABASE_URL="postgresql://postgres:<parola>@localhost:5432/fp3"
CORS_ORIGINS="http://localhost:3001,http://localhost:3100"
```

> **macOS port notu**: 5000 portu AirPlay Receiver'a ait, bu yüzden AI
> servisi varsayılan olarak **3002** kullanır (FP3 port standardı). Fastify
> tarafında `AI_SERVICE_URL=http://localhost:3002`.

## 🔌 Endpoint'ler (Python — direkt çağrı için)

| Endpoint | Açıklama |
|----------|----------|
| `GET  /health` | Genel sağlık. |
| `GET  /api/ai/health` | Model + tag cache durumu. |
| `POST /api/ai/extract-tags` | Metin → keyword + tag öneri listesi. |
| `POST /api/ai/analyze-profile` | Bio + publication özetleri → tag + araştırma alanları. |
| `POST /api/ai/reload-tags` | DB'den tag listesini yeniden cache'le (yeni tag eklenince). |

### Örnek istek

```bash
curl -X POST http://localhost:3002/api/ai/extract-tags \
  -H "Content-Type: application/json" \
  -d '{"text":"transformer-based NLP for Turkish sentiment analysis","top_n":5}'
```

```json
{
  "suggested_tags": [
    { "tag_id": "...", "tag_name": "NLP",            "category": "AI/ML", "confidence": 0.71 },
    { "tag_id": "...", "tag_name": "Deep Learning",  "category": "AI/ML", "confidence": 0.65 },
    { "tag_id": "...", "tag_name": "Machine Learning","category": "AI/ML", "confidence": 0.63 }
  ],
  "keywords": ["sentiment analysis", "transformer based", "nlp turkish", ...]
}
```

## 🎯 Eşleştirme Algoritması

Şu adımları izler (`match_tags()` fonksiyonu):

1. **KeyBERT** kullanıcı metninden ~10 anahtar kelime çıkarır.
2. Hem orijinal metin hem de her keyword **ayrı ayrı embed edilir**.
3. Her tag için, **tüm sorguların maksimum benzerliği** alınır
   (ortalama değil — uzun metinlerin sulandırma etkisinden kaçınmak için).
4. `confidence >= 0.35` olan tag'ler, top-N'e göre sıralanıp dönülür.

> **Neden max?** Uzun bir proje açıklamasında "transformer", "Turkish",
> "sentiment analysis" gibi spesifik terimler genel metinde kaybolur.
> Her keyword'ü ayrı embed edip max alınca, bu spesifik sinyaller en yakın
> tag'i yakalar.

## 🔄 Tag Cache

- Startup'ta DB'den tüm tag'ler çekilip her birinin embedding'i hesaplanır.
- `tag_embeddings` numpy array olarak RAM'de tutulur (shape: `[n_tags, 384]`).
- **Yeni tag eklendiğinde** cache stale olur:

  ```bash
  curl -X POST http://localhost:3001/api/ai/reload-tags
  ```

## 🖥 UI Entegrasyonu

AI önerileri **`AiTagSuggestions`** component'i (`apps/web/src/components/ai-tag-suggestions.tsx`)
ile sunulur. Şu sayfalarda kullanılır:

| Sayfa | Kaynak metin | Tetik |
|-------|--------------|-------|
| `/projects/new` | `title + description` | "AI ile Öner" butonu |
| `/publications/new` | `title + abstract` | "AI ile Öner" butonu |
| `/profile` (tag seçim adımı) | `bio` (≥20 char olunca) | "AI ile Öner" butonu |
| `/matching` (hoca team wizard) | `title + description` | Tag seçim adımında |

### Component davranışı

- **Confidence rozetleri** — yeşil (≥0.7 güçlü), mavi (0.55–0.7 orta), gri (<0.55 zayıf).
- **Tıklanan tag** → mevcut seçim listesine eklenir (`onAdd` callback).
- **Zaten seçili** tag'ler "Eklendi ✓" olarak gösterilir.
- **Tekrar Öner** — metin değiştikten sonra yeniden sorgu.
- **Hata yönetimi** — AI servisi kapalıysa kullanıcıya net hata mesajı
  ("apps/ai-service çalışıyor mu?"). UI ölmez, manual tag seçimi çalışmaya
  devam eder.

### Kullanım örneği

```tsx
import { AiTagSuggestions } from "@/components/ai-tag-suggestions";

<AiTagSuggestions
  text={`${form.title}\n\n${form.description}`}
  selectedTagIds={tagIds}
  onAdd={(id) => {
    if (!tagIds.includes(id) && tagIds.length < 10) {
      setTagIds([...tagIds, id]);
    }
  }}
  description="Başlık + açıklamadan tag önerisi al."
  minLength={20}
  topN={6}
/>
```

## 📊 Performans

- Cold start (model yükleme): ~3 sn
- `/extract-tags` çağrısı: ~50–150 ms (MPS), ~200–400 ms (CPU)
- RAM kullanımı: ~250–400 MB

## ⚠️ Bilinen Sınırlamalar

1. **Türkçe metinde kalite düşer**: `all-MiniLM-L6-v2` ağırlıklı İngilizce.
   Türkçe bio'larda öneri sayısı azalır. Daha iyi alternatif:
   `paraphrase-multilingual-MiniLM-L12-v2` (model isminin değişmesi yeterli,
   tag cache otomatik yeniden hesaplanır).

2. **Threshold sabit**: `0.35` ile başlıyoruz. Yeni domain'ler için
   ayarlanması gerekebilir.

3. **Local-only**: Şu an cloud deployment yok. Production'a çıkarken
   ya başka bir port'a deploy edilecek ya da serverless'a taşınacak.

## 🔧 Geliştirme

Servisteki main file (`apps/ai-service/main.py`) `uvicorn --reload` ile
çalışır — kaydedince otomatik yenilenir.

Bağımlılıklar `requirements.txt` veya `pyproject.toml` üzerinden:

```bash
cd apps/ai-service
.venv/bin/pip install -r requirements.txt
```

Yeni endpoint eklerken:
- Pydantic model tanımla
- `@app.post("/api/ai/...")` ile route ekle
- `apps/api/src/routes/ai.ts`'te proxy karşılığını ekle (auth + body validation)
- `apps/web/src/lib/api.ts → aiApi`'ya helper ekle
