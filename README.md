<div align="center">

# 🎓 FP3 — Finding Publication Project Partner

**Tag tabanlı akıllı eşleştirmeyle üniversitede proje & makale ortaklığı.**

Öğrenciler ilgi alanlarına göre hocalarla, hocalar projelerine uygun öğrenci/akademisyenlerle buluşur.
Tek bir platform — keşif, başvuru, davet ve ekip kurma birlikte.

<sub>Ostim Teknik Üniversitesi · `@ostimteknik.edu.tr` mail domain'i ile sınırlı</sub>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Fastify](https://img.shields.io/badge/Fastify-5-000?logo=fastify)](https://fastify.dev)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://prisma.io)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000?logo=expo)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-AI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## ✨ Öne Çıkan Özellikler

| 🎯 | Özellik | Açıklama |
|----|---------|----------|
| 🔍 | **Akıllı Eşleştirme** | Tag + aktivite + departman skoruyla öğrenci ↔ hoca ↔ proje önerisi |
| 🧠 | **Yerel AI Tag Önerisi** | KeyBERT + sentence-transformers ile metinden otomatik tag çıkarımı; cloud API yok |
| 👥 | **Ekip Kurma Wizard'ı** | Hoca proje fikri yazar → AI tag önerir → öneren hoca/öğrencileri seçer → tek tıkla proje + davet |
| 📥 | **Birleşik Gelen Kutusu** | Başvurular, talepler, davetler tek yerde — bekleyenler rozetli |
| ✉️ | **Davet Sistemi** | Proje sahibi başkalarını davet eder; kabul → otomatik üyelik (kontenjan kontrollü) |
| 📱 | **Web + Mobile** | Aynı backend, paylaşımlı tipler; Next.js dashboard + Expo native uygulama |
| 🔐 | **Çift Mod Auth** | Better Auth — web cookie, mobile Bearer token |
| 📚 | **Otomatik API Docs** | API ve AI servisi için tutarlı Scalar UI (`localhost:3001/docs`, `localhost:3002/docs`) |

---

## 🏗 Mimari

```
┌─────────────────────┐     ┌─────────────────────┐
│  Next.js Web        │     │  Expo Mobile        │
│  :3000              │     │  (Bearer auth)      │
└──────────┬──────────┘     └──────────┬──────────┘
           │ fetch /api/*               │ fetch /api/*
           ▼                            ▼
       ┌──────────────────────────────────────┐
       │  Fastify API   :3001                  │
       │  Better Auth · Prisma · Scalar docs  │
       └──────┬───────────────────────┬────────┘
              │ proxy                  │ prisma
              ▼                        ▼
      ┌──────────────────┐    ┌──────────────┐
      │  Python AI       │    │ PostgreSQL    │
      │  :3002           │    │ :5432         │
      │  KeyBERT +       │◀───│ (Tag cache)   │
      │  MiniLM-L6-v2    │    └──────────────┘
      └──────────────────┘
```

Detaylı mimari → [`docs/architecture.md`](./docs/architecture.md)

---

## 🛠 Tech Stack

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| **Monorepo** | Turborepo + pnpm workspaces | pnpm `9.15.4` |
| **Web** | Next.js (App Router) + Tailwind v4 + shadcn/ui | `16.1.x` |
| **API** | Fastify + Prisma + Better Auth | `5.2.x` |
| **AI** | Python FastAPI + KeyBERT + sentence-transformers | `all-MiniLM-L6-v2` |
| **Mobile** | Expo + Expo Router | SDK `54` |
| **DB** | PostgreSQL | `17` (lokal Homebrew / Windows installer) |
| **State** | TanStack Query | `5.x` |
| **Icons** | Phosphor Icons | — |

---

## 🚀 Hızlı Başlangıç

> Windows için detaylı rehber → [`setup.md`](./setup.md) (sadece local, paylaşılmaz)
> macOS/Linux için aynı adımlar geçerlidir.

```bash
# 1. Klonla ve yükle
git clone https://github.com/<owner>/fp3.git
cd fp3
pnpm install

# 2. .env dosyalarını oluştur — örnekler:
cp apps/api/.env.example.local apps/api/.env
# apps/web/.env.local ve apps/ai-service/.env'i de aynı şekilde
# (içeriği apps/api/.env.example.local'da görebilirsin)

# 3. DB hazırlığı
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed       # demo veri (örnek kullanıcılar dahil)
cd ../..

# 4. Python AI servisi
cd apps/ai-service
python -m venv .venv && source .venv/bin/activate  # win: .venv\Scripts\activate
pip install -r requirements.txt
cd ../..

# 5. Çalıştır
pnpm dev               # web (3000) + api (3001) + mobile
pnpm dev:ai            # ai servisi (3002) — ayrı terminal
```

### Kontroller
```bash
curl http://localhost:3001/health            # API: {"status":"ok"}
curl http://localhost:3002/api/ai/health     # AI:  {"status":"ok","model_loaded":true}
open http://localhost:3000                   # Web
open http://localhost:3001/docs              # API Docs (Scalar)
open http://localhost:3002/docs              # AI Docs  (Scalar)
```

---

## 🔌 Port Standardı

| Servis | Port | URL |
|--------|------|-----|
| **Web** (Next.js) | `3000` | http://localhost:3000 |
| **API** (Fastify) | `3001` | http://localhost:3001 |
| **AI** (FastAPI) | `3002` | http://localhost:3002 |s
| **Postgres** | `5432` | — |
| Expo Metro (opsiyonel) | `8081` | — |

Tüm portlar değişebilir — `apps/<servis>/.env` üzerinden override.

---

## 📁 Monorepo Yapısı

```
fp3/
├── apps/
│   ├── web/              Next.js 16 dashboard
│   ├── api/              Fastify backend + Prisma + Better Auth
│   ├── ai-service/       Python FastAPI (KeyBERT + embeddings)
│   └── mobile/           Expo native app
├── packages/
│   ├── shared-types/     TS tipleri (User, Project, ...)
│   ├── validation/       Zod şemaları (web/api/mobile paylaşır)
│   └── config/           TSConfig base
├── docs/                 Detaylı proje dokümantasyonu (bkz. aşağı)
├── setup.md              Windows kurulum rehberi (gitignored)
└── AGENTS.md             AI asistanları için bağlam dosyası
```

---

## 📚 Dokümantasyon

Tüm detaylar `docs/` altında — her belgenin amacı tek satırda:

| Belge | İçerik |
|-------|--------|
| [`docs/README.md`](./docs/README.md) | Doküman indeksi |
| [`docs/architecture.md`](./docs/architecture.md) | Servisler, portlar, veri akışı |
| [`docs/database.md`](./docs/database.md) | 13 tablo, ilişki diyagramı, migration politikası |
| [`docs/api.md`](./docs/api.md) | Tüm endpoint referansı |
| [`docs/ai-service.md`](./docs/ai-service.md) | AI algoritması ve UI entegrasyonu |
| [`docs/auth.md`](./docs/auth.md) | Better Auth + Bearer + cookie akışları |
| [`docs/web-app.md`](./docs/web-app.md) | Next.js sayfaları, component'ler |
| [`docs/mobile-app.md`](./docs/mobile-app.md) | Expo route'ları, native auth detayları |
| [`docs/features/inbox.md`](./docs/features/inbox.md) | Birleşik Gelen Kutusu |
| [`docs/features/matching.md`](./docs/features/matching.md) | Matching wizard akışı |
| [`docs/features/invitations.md`](./docs/features/invitations.md) | Davet sistemi |

---

## 🎯 Kullanım Senaryoları

### Öğrenci olarak
1. **Profil** doldur → bio'dan AI tag önerisi al → ilgi alanlarını seç
2. **Eşleştirme** sayfasında "Makale" veya "Proje" amacını seç → en uygun hocaları listele
3. Bir hocaya doğrudan **proje önerisi** gönder veya **açık projeye başvur**
4. **Gelen Kutusu → Davetlerim**'de bir hocadan davet gelirse kabul/reddet

### Hoca olarak
1. **Matching → Ekip Kur** wizard'ını çalıştır: fikir + kontenjan + tag → AI önerir
2. Önerilen hoca + öğrencileri seç → **tek tıkla proje açılır**, herkese davet gider
3. **Gelen Kutusu** üç sekme:
   - **Proje Başvuruları** — açık projeme başvuranlar
   - **Öğrenci Talepleri** — bana doğrudan proje öneren öğrenciler
   - **Davetlerim** — başkasının beni davet ettiği projeler
4. **Projelerim** sayfasında her projenin durumunu (üye, başvuru, bekleyen davet) takip et

---

## 🔐 Kodlama & Convention'lar

| Kural | Notlar |
|-------|--------|
| **TypeScript strict** | Her pakette `tsc --noEmit` |
| **UI bileşenleri** | shadcn/ui + Tailwind v4 + Phosphor Icons |
| **Primary renk** | Indigo (`#6366f1`) |
| **API response** | `{ success, data?, error? }` |
| **Pagination** | `{ data: T[], meta: { page, limit, total, totalPages } }` |
| **Workspace import** | `@fp3/shared-types`, `@fp3/validation`, `@fp3/config` |
| **Dil** | UI: Türkçe · Kod: İngilizce |
| **Dosya isimleri** | kebab-case (`invite-modal.tsx`); camelCase fonksiyonlar |

---

## 🔧 Faydalı Komutlar

```bash
# Geliştirme
pnpm dev                    # tüm servisleri başlat (web + api + mobile)
pnpm dev:web                # sadece web
pnpm dev:api                # sadece API
pnpm dev:ai                 # sadece Python AI servisi
pnpm dev:mobile             # sadece Expo

# Bakım
pnpm clean-ports            # 3000,3001,3002,8081 portlarını öldür
pnpm dev:fresh              # clean-ports + dev (yeniden başlat)
pnpm type-check             # tüm paketlerde tsc --noEmit
pnpm build                  # production build
pnpm format                 # Prettier

# Database (apps/api dizininde)
pnpm prisma:generate        # Prisma Client
pnpm prisma:migrate         # migration uygula
pnpm prisma:seed            # demo veri
pnpm prisma:studio          # görsel DB editörü :5555
```

---

## 🐛 Sık Karşılaşılan Sorunlar

| Belirti | Çözüm |
|---------|-------|
| `Cannot find module @fp3/xxx` | `pnpm install` |
| Prisma client yok | `cd apps/api && pnpm prisma:generate` |
| Port çakışması | `pnpm clean-ports` |
| API docs boş geliyor | tsx watch reload sorunu — `pkill -9 -f tsx` + `pnpm dev` |
| AI servisi 503 | model henüz yüklenmedi — 10–30 sn bekle |
| Mobile telefondan API'ye bağlanmıyor | `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3001` ayarla |

Daha fazla → [`setup.md`](./setup.md) ve `docs/`

---

## 🤝 Katkı

Proje aktif geliştirme aşamasında. Major değişiklikler için issue açıp tartışmak en sağlıklısı.

PR akışı:
1. Branch oluştur (`feat/...`, `fix/...`, `chore/...`)
2. `pnpm type-check` ve `pnpm build` geçsin
3. Atomik commit'ler (her commit derlenebilir + tek bir mantıksal değişiklik)
4. PR açarken ne değiştiğini ve neden gerekli olduğunu açıkla


---

## 📜 Lisans

Bu proje üniversite ödevi olarak başladı; lisans henüz tanımlanmadı.
Kullanım için ekibe danış.

---

<div align="center">

**FP3** · Made with ☕ for the Ostim Teknik Üniversitesi research community

</div>
