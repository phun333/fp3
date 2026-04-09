# FP3 — Finding Publication Project Partner

## 🎯 Proje Özeti

Üniversite öğrencileri ve akademisyenler arasında **makale/proje ortaklığı** kurmayı sağlayan, tag tabanlı akıllı eşleştirme platformu. Öğrenciler ilgi alanlarına göre hoca bulabilir, hocalar projelerine uygun öğrenci arayabilir.

- **Üniversite:** Ostim Teknik Üniversitesi
- **Mail Domain:** Sadece `@ostimteknik.edu.tr` mailleri kabul edilir

---

## 🛠 Tech Stack

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| **Monorepo** | Turborepo + pnpm workspaces | pnpm 9.15.4 |
| **Web** | Next.js (App Router) | 16.1.6 |
| **API** | Fastify (TypeScript) | 5.2.0 |
| **AI Service** | Python FastAPI + KeyBERT | - |
| **Mobile** | Expo (React Native) | SDK 52 |
| **ORM** | Prisma + PostgreSQL (Neon) | 6.4.0 |
| **Auth** | Better Auth | 1.4.18 |
| **UI** | Tailwind CSS v4 + shadcn/ui | - |
| **Icons** | Phosphor Icons | - |
| **State** | TanStack Query | 5.64.0 |

---

## 📁 Proje Yapısı

```
fp3/
├── apps/
│   ├── web/                 # Next.js 16 (App Router)
│   │   ├── src/app/         # Sayfalar (App Router)
│   │   ├── src/components/  # React bileşenleri
│   │   ├── src/lib/         # Yardımcı fonksiyonlar, hooks
│   │   └── src/styles/      # Global CSS
│   │
│   ├── api/                 # Fastify Backend
│   │   ├── src/routes/      # API route'ları
│   │   ├── src/lib/         # Auth, Prisma, utils
│   │   ├── src/middleware/  # Auth middleware
│   │   └── prisma/          # Şema ve seed
│   │
│   ├── ai-service/          # Python FastAPI
│   │   └── main.py          # KeyBERT + sentence-transformers
│   │
│   └── mobile/              # Expo (React Native)
│       └── app/             # Expo Router sayfaları
│
├── packages/
│   ├── shared-types/        # Paylaşımlı TypeScript tipleri
│   ├── config/              # TSConfig'ler
│   └── validation/          # Zod şemaları
│
├── turbo.json               # Turborepo config
├── pnpm-workspace.yaml      # pnpm workspace config
└── package.json             # Root package
```

---

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle
```bash
pnpm install
```

### 2. Environment Variables
```bash
# apps/api/.env
DATABASE_URL="postgresql://user:pass@host:5432/fp3"
BETTER_AUTH_SECRET="random-secret-key"
BETTER_AUTH_URL="http://localhost:4000"
JWT_SECRET="random-jwt-secret"
AI_SERVICE_URL="http://localhost:5001"
CORS_ORIGINS="http://localhost:3000"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000"

# apps/ai-service/.env
DATABASE_URL="postgresql://..."
CORS_ORIGINS="http://localhost:4000,http://localhost:3000"
```

### 3. Database Setup
```bash
cd apps/api
pnpm prisma:generate    # Prisma client oluştur
pnpm prisma:migrate     # Migration çalıştır
pnpm prisma:seed        # Örnek veri ekle
pnpm prisma:studio      # Prisma Studio aç
```

### 4. Servisleri Başlat
```bash
# Tümünü başlat
pnpm dev

# Ayrı ayrı başlat
pnpm dev:api            # API (port 4000)
pnpm dev:web            # Web (port 3000)
pnpm dev:mobile         # Mobile (Expo)

# AI Service (ayrı terminal)
cd apps/ai-service
pip install -r requirements.txt
source .venv/bin/activate
python main.py          # port 5001 (Mac'te 5000 AirPlay kullanıyor)
```

---

## 📊 Veritabanı Modeli

### Ana Modeller
- **User**: Öğrenci veya Hoca (role: STUDENT | PROFESSOR)
- **Tag**: İlgi alanı etiketleri (NLP, Machine Learning, vb.)
- **UserTag**: Kullanıcı-Tag ilişkisi
- **Project**: Hocaların açtığı projeler
- **ProjectTag**: Proje-Tag ilişkisi
- **Publication**: Akademik yayınlar
- **Application**: Projelere başvurular
- **SavedMatch**: Kaydedilen eşleşmeler

### İlişki Diyagramı
```
User ──┬── UserTag ──── Tag
       │
       ├── Project ──── ProjectTag ──── Tag
       │      │
       │      └── Application
       │
       ├── Publication ─── PublicationTag ─── Tag
       │
       └── SavedMatch
```

---

## 🔌 API Endpoints

### Auth (`/api/auth/*`)
- `POST /sign-up` - Kayıt ol
- `POST /sign-in` - Giriş yap
- `POST /sign-out` - Çıkış yap
- `GET /session` - Session bilgisi

### Profil (`/api/profile`)
- `GET /` - Kendi profilini getir
- `PUT /` - Profil güncelle
- `PUT /tags` - Tag'leri güncelle
- `GET /:id` - Başka kullanıcı profili

### Hocalar (`/api/professors`)
- `GET /` - Hoca listesi (pagination, filtre)
- `GET /:id` - Hoca detayı + yayınlar + projeler

### Öğrenciler (`/api/students`)
- `GET /` - Öğrenci listesi
- `GET /:id` - Öğrenci detayı

### Projeler (`/api/projects`)
- `GET /` - Proje listesi (filtre: status, tags)
- `POST /` - Yeni proje (sadece hoca)
- `GET /:id` - Proje detayı
- `PUT /:id` - Proje güncelle
- `DELETE /:id` - Proje sil

### Başvurular (`/api/applications`)
- `POST /projects/:id/apply` - Projeye başvur
- `GET /projects/:id/applications` - Başvuruları listele
- `PUT /:id` - Başvuru durumu güncelle
- `GET /my` - Kendi başvurularım

### Yayınlar (`/api/publications`)
- `GET /` - Yayın listesi
- `POST /` - Yeni yayın (sadece hoca)
- `GET /:id` - Yayın detayı
- `PUT /:id` - Yayın güncelle
- `DELETE /:id` - Yayın sil

### Eşleştirme (`/api/discover`, `/api/matching`)
- `GET /discover/professors` - Önerilen hocalar
- `GET /discover/projects` - Önerilen projeler
- `GET /discover/students` - Önerilen öğrenciler
- `GET /matching/professors` - Tag eşleşmesi ile hocalar

### AI (`/api/ai`)
- `POST /extract-tags` - Metinden tag çıkar
- `POST /analyze-profile` - Profil analizi
- `POST /reload-tags` - Tag cache yenile

### Tag'ler (`/api/tags`)
- `GET /` - Tüm tag'ler (kategori gruplu)
- `GET /:id` - Tag detayı

---

## 🎨 Web Sayfaları (Next.js App Router)

```
/                           # Landing page
/signup                     # Kayıt
/login                      # Giriş (Better Auth)
/(dashboard)/
  ├── dashboard/            # Ana dashboard
  ├── profile/              # Profil düzenleme
  ├── discover/             # Keşif (öneriler)
  ├── matching/             # Detaylı eşleştirme
  ├── professors/           # Hoca listesi
  ├── professors/[id]/      # Hoca detay
  ├── projects/             # Proje listesi
  ├── projects/new/         # Yeni proje
  ├── projects/[id]/        # Proje detay
  ├── my-projects/          # Projelerim (hoca)
  ├── my-applications/      # Başvurularım (öğrenci)
  ├── publications/         # Yayın listesi
  ├── publications/new/     # Yeni yayın
  └── saved-matches/        # Kaydedilen eşleşmeler
```

---

## 🧩 Paylaşımlı Paketler

### @fp3/shared-types
```typescript
import { User, Project, Tag, Application } from "@fp3/shared-types"
```

### @fp3/validation
```typescript
import { createProjectSchema, loginSchema } from "@fp3/validation"
```

### @fp3/config
```json
// tsconfig.json'da kullanım
{ "extends": "@fp3/config/tsconfig.base.json" }
```

---

## ✅ Kodlama Kuralları

| Kural | Detay |
|-------|-------|
| **TypeScript** | Strict mode, her projede |
| **UI Bileşenleri** | shadcn/ui + Phosphor Icons |
| **Primary Renk** | Indigo (#6366f1) |
| **API Response** | `{ success: boolean, data?: T, error?: string }` |
| **Pagination** | `{ data: T[], meta: { page, limit, total, totalPages } }` |
| **Import** | Workspace: `import { X } from "@fp3/shared-types"` |
| **Dil** | UI: Türkçe, Kod: İngilizce |
| **Dosya İsimleri** | kebab-case (bileşenler), camelCase (fonksiyonlar) |

---

## 📝 Önemli Notlar

1. **Next.js versiyonu 16.1.6 sabit**, değiştirme
2. **Sadece @ostimteknik.edu.tr** email'leri kabul edilir
3. **AI servisi ücretsiz model** kullanır: `all-MiniLM-L6-v2`
4. **Neon PostgreSQL** ücretsiz tier kullanılır
5. Her değişiklikten sonra `pnpm type-check` yapılmalı

---

## 🔧 Faydalı Komutlar

```bash
# Geliştirme
pnpm dev                    # Tüm servisleri başlat
pnpm dev:web                # Sadece web
pnpm dev:api                # Sadece API
pnpm build                  # Tüm projeleri build et
pnpm type-check             # TypeScript kontrol
pnpm format                 # Prettier ile formatla

# Database
cd apps/api
pnpm prisma:generate        # Prisma client
pnpm prisma:migrate         # Migration
pnpm prisma:seed            # Seed data
pnpm prisma:studio          # Görsel DB yönetimi

# AI Service
cd apps/ai-service
python main.py              # Servisi başlat
```

---

## 🐛 Troubleshooting

### "Cannot find module @fp3/xxx"
```bash
pnpm install
```

### Prisma client bulunamıyor
```bash
cd apps/api && pnpm prisma:generate
```

### AI Service model yükleme yavaş
İlk çalıştırmada model (~90MB) indirilir, sonraki çalıştırmalarda cache'den gelir.

### Port çakışması
- Web: 3000
- API: 4000
- AI Service: 5001

---

## 📚 Ek Kaynaklar

- [fp3-project-plan.md](./fp3-project-plan.md) - Detaylı proje planı ve fazlar
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Katkı rehberi
- API Docs: `http://localhost:4000/docs` (Scalar UI)
