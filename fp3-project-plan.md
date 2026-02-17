# FP3 — Finding Publication Project Partner

## Proje Özeti

Üniversite öğrencileri ve akademisyenler arasında makale/proje ortaklığı kurmayı sağlayan, tag tabanlı akıllı eşleştirme platformu. Öğrenciler ilgi alanlarına göre hoca bulabilir, hocalar projelerine uygun öğrenci arayabilir. Hem web hem mobil destekli.

**Üniversite:** Ostim Teknik Üniversitesi
**Mail Domain:** @ostimteknik.edu.tr

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| **Web Frontend** | Next.js (App Router) |
| **Mobil** | Expo (React Native) |
| **Backend API** | Fastify (Node.js / TypeScript) |
| **ORM** | Prisma |
| **Veritabanı** | PostgreSQL (Neon — ücretsiz tier) |
| **Auth** | Better Auth (email doğrulama, @ostimteknik.edu.tr kısıtlı) |
| **AI Tagleme** | Python FastAPI + KeyBERT + sentence-transformers (local, ücretsiz) |
| **Monorepo** | Turborepo (paylaşımlı tipler ve config) |
| **Hosting** | Vercel (web), Railway/Render (Fastify + Python servisi) |

---

## Mimari Diyagram

```
┌──────────────────┐     ┌──────────────────────────────┐
│  Next.js (Web)   │────→│                              │
│  Vercel          │     │   Fastify API (:4000)        │
└──────────────────┘     │                              │
                         │   ├── Better Auth             │
┌──────────────────┐     │   ├── /api/auth/*            │
│  Expo (Mobil)    │────→│   ├── /api/professors        │──→ PostgreSQL (Neon)
│  iOS / Android   │     │   ├── /api/students          │
└──────────────────┘     │   ├── /api/projects          │
                         │   ├── /api/tags              │
                         │   ├── /api/matches           │
                         │   └── /api/ai/tag (proxy)    │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Python AI Service   │
                         │  FastAPI (:5000)     │
                         │  KeyBERT +           │
                         │  sentence-transformers│
                         └──────────────────────┘
```

---

## Veritabanı Şeması (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  STUDENT
  PROFESSOR
}

enum ProjectStatus {
  OPEN
  IN_PROGRESS
  CLOSED
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique // @ostimteknik.edu.tr
  name          String
  role          UserRole
  department    String
  bio           String?
  avatarUrl     String?
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // İlişkiler
  tags          UserTag[]
  projects      Project[]      @relation("ProjectOwner")
  applications  Application[]  @relation("Applicant")
  publications  Publication[]

  // Better Auth ilişkileri
  sessions      Session[]
  accounts      Account[]
}

model Tag {
  id       String    @id @default(cuid())
  name     String    @unique  // "Machine Learning", "IoT", "NLP" vb.
  category String?             // "AI", "Network", "Security" vb.

  users    UserTag[]
  projects ProjectTag[]
  publications PublicationTag[]
}

model UserTag {
  userId String
  tagId  String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([userId, tagId])
}

model Project {
  id          String        @id @default(cuid())
  title       String
  description String
  status      ProjectStatus @default(OPEN)
  maxMembers  Int           @default(3)
  ownerId     String
  owner       User          @relation("ProjectOwner", fields: [ownerId], references: [id])
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  tags         ProjectTag[]
  applications Application[]
}

model ProjectTag {
  projectId String
  tagId     String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([projectId, tagId])
}

model Publication {
  id        String   @id @default(cuid())
  title     String
  abstract  String?
  url       String?
  year      Int?
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())

  tags PublicationTag[]
}

model PublicationTag {
  publicationId String
  tagId         String
  publication   Publication @relation(fields: [publicationId], references: [id], onDelete: Cascade)
  tag           Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([publicationId, tagId])
}

model Application {
  id          String            @id @default(cuid())
  status      ApplicationStatus @default(PENDING)
  message     String?
  projectId   String
  project     Project           @relation(fields: [projectId], references: [id])
  applicantId String
  applicant   User              @relation("Applicant", fields: [applicantId], references: [id])
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@unique([projectId, applicantId])
}

// Better Auth tabloları
model Session {
  id        String   @id
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
}

model Account {
  id                String  @id
  userId            String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope             String?
  idToken           String?
  password          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

# FAZLAR

Her faz bağımsız bir Claude Code prompt'u olarak kullanılabilir.

---

## FAZ 1 — Proje Altyapısı ve Monorepo Kurulumu

### Amaç
Turborepo monorepo yapısını kur, tüm uygulamalar ve paylaşımlı paketler için temel iskelet oluştur.

### Claude Code Prompt:

```
FP3 projesi için Turborepo monorepo yapısı kur. Yapı şu şekilde olmalı:

fp3/
├── apps/
│   ├── web/          → Next.js (App Router, TypeScript)
│   ├── mobile/       → Expo (React Native, TypeScript)
│   ├── api/          → Fastify (TypeScript)
│   └── ai-service/   → Python FastAPI
├── packages/
│   ├── shared-types/ → Paylaşımlı TypeScript tipleri
│   ├── config/       → ESLint, TypeScript config
│   └── validation/   → Zod şemaları (API ve form validasyonu için paylaşımlı)
├── turbo.json
├── package.json
└── .gitignore

Detaylar:
- Next.js: App Router, Tailwind CSS, TypeScript strict mode
- Expo: Expo SDK son sürüm, TypeScript, expo-router
- Fastify: TypeScript, @fastify/cors, @fastify/jwt eklentileri
- ai-service: Python 3.11+, FastAPI, requirements.txt ile (keybert, sentence-transformers, fastapi, uvicorn)
- shared-types: User, Project, Tag, Application gibi entity tipleri
- validation: Zod şemaları — createProject, createUser, login gibi
- Turborepo pipeline: build, dev, lint, type-check
- Root'ta .env.example oluştur (DATABASE_URL, JWT_SECRET, AI_SERVICE_URL, BETTER_AUTH_SECRET)
- Her app için ayrı dev script: "turbo run dev --filter=web", "turbo run dev --filter=api" vb.

Her uygulamada basit bir health check endpoint veya sayfa olsun:
- web: "/" sayfası "FP3 Web" yazsın
- api: GET /health → { status: "ok" }
- ai-service: GET /health → { status: "ok" }
- mobile: basit bir "FP3 Mobile" ekranı
```

---

## FAZ 2 — Veritabanı ve Prisma Kurulumu

### Amaç
PostgreSQL bağlantısı, Prisma şeması, migration ve seed data.

### Claude Code Prompt:

```
FP3 projesinin apps/api dizininde Prisma kurulumunu yap.

1. Prisma'yı kur ve initialize et
2. Aşağıdaki Prisma şemasını schema.prisma'ya yaz:

[Yukarıdaki tam Prisma şemasını buraya yapıştır]

3. Migration oluştur: "init" adıyla

4. Seed dosyası oluştur (prisma/seed.ts):
   - Önceden tanımlı tag listesi oluştur (en az 30 tag):
     Kategoriler ve örnekler:
     - AI/ML: "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Reinforcement Learning", "LLM"
     - Data: "Veri Analizi", "Büyük Veri", "Veri Madenciliği", "İstatistik"
     - Web: "Frontend", "Backend", "Full Stack", "Web Güvenliği", "API Tasarımı"
     - Mobil: "iOS", "Android", "Cross-Platform", "React Native"
     - Güvenlik: "Siber Güvenlik", "Kriptografi", "Ağ Güvenliği", "Penetrasyon Testi"
     - Donanım: "IoT", "Gömülü Sistemler", "Robotik", "FPGA"
     - Yazılım: "Yazılım Mühendisliği", "DevOps", "Cloud Computing", "Mikro Servisler"
     - Diğer: "Blokzincir", "Oyun Geliştirme", "AR/VR", "Biyoinformatik"
   
   - 5 örnek hoca profili oluştur (her biri 3-5 tag ile)
   - 10 örnek öğrenci profili oluştur (her biri 2-4 tag ile)
   - 3 örnek proje oluştur (tag'li, açık durumda)
   - 2 örnek yayın oluştur (tag'li)

5. package.json'a seed script ekle: "prisma:seed": "ts-node prisma/seed.ts"

6. Prisma client'ı singleton pattern ile export eden bir lib/prisma.ts dosyası oluştur

Neon PostgreSQL kullanılacak, DATABASE_URL .env'den okunacak.
```

---

## FAZ 3 — Authentication (Better Auth + Fastify)

### Amaç
Better Auth ile email tabanlı authentication. Sadece @ostimteknik.edu.tr mailleri kabul edilecek.

### Claude Code Prompt:

```
FP3 projesinin apps/api dizininde Better Auth kurulumunu yap.

1. Better Auth'u Fastify ile entegre et:
   - @better-auth/core ve gerekli paketleri kur
   - Prisma adapter kullan (Better Auth'un Prisma adapter'ı)

2. Auth konfigürasyonu (lib/auth.ts):
   - Email + şifre tabanlı authentication
   - Email doğrulama zorunlu
   - Sadece @ostimteknik.edu.tr uzantılı mailler kabul edilsin
   - Kayıt sırasında rol seçimi: STUDENT veya PROFESSOR
   - Session yönetimi: JWT tabanlı, 7 gün expiry
   
3. Auth route'ları Fastify'a bağla:
   - POST /api/auth/signup → kayıt (email, password, name, role, department)
   - POST /api/auth/signin → giriş
   - POST /api/auth/signout → çıkış
   - GET /api/auth/session → session bilgisi
   - POST /api/auth/verify-email → email doğrulama
   - POST /api/auth/forgot-password → şifre sıfırlama

4. Email doğrulama:
   - Kayıt sonrası doğrulama linki gönder
   - Dev ortamda console'a log'la (gerçek mail gönderme yapma, ileride Resend entegre edilecek)

5. Middleware oluştur:
   - requireAuth: session kontrolü, yoksa 401
   - requireRole("PROFESSOR"): sadece hoca erişimi
   - requireRole("STUDENT"): sadece öğrenci erişimi

6. Signup'ta email validasyonu:
   ```typescript
   if (!email.endsWith("@ostimteknik.edu.tr")) {
     throw new Error("Sadece @ostimteknik.edu.tr uzantılı mailler kabul edilir");
   }
   ```

7. Test: signup → verify → signin → session check akışını test eden basit bir script yaz
```

---

## FAZ 4 — Core API Endpoint'leri (Fastify)

### Amaç
Tüm CRUD işlemleri ve iş mantığı endpoint'leri.

### Claude Code Prompt:

```
FP3 projesinin apps/api dizininde core API endpoint'lerini oluştur. Fastify plugin pattern kullan.

Her route dosyası bir Fastify plugin olsun ve src/routes/ altında organize edilsin.

### Profil Yönetimi
- GET /api/profile → kendi profilini getir (auth gerekli)
- PUT /api/profile → profil güncelle (name, bio, department, avatarUrl)
- GET /api/profile/:id → başka kullanıcının public profilini getir
- PUT /api/profile/tags → kendi tag'lerini güncelle (tag ID listesi gönder)

### Hoca Endpoint'leri
- GET /api/professors → hoca listesi (pagination, tag filtresi, arama)
  - Query params: ?page=1&limit=10&tags=tag1,tag2&search=isim
  - Response: hocalar + tag'leri + yayın sayıları
- GET /api/professors/:id → hoca detayı (profil + tag'ler + yayınlar + projeler)

### Öğrenci Endpoint'leri
- GET /api/students → öğrenci listesi (pagination, tag filtresi, arama)
- GET /api/students/:id → öğrenci detayı (profil + tag'ler + başvurular)

### Proje Yönetimi
- POST /api/projects → yeni proje oluştur (auth: PROFESSOR)
  - Body: title, description, maxMembers, tagIds[]
- GET /api/projects → proje listesi (pagination, status filtresi, tag filtresi)
  - Query: ?status=OPEN&tags=tag1,tag2&search=keyword
- GET /api/projects/:id → proje detayı (owner + tag'ler + başvurular)
- PUT /api/projects/:id → proje güncelle (auth: owner)
- DELETE /api/projects/:id → proje sil (auth: owner)

### Yayın Yönetimi
- POST /api/publications → yayın ekle (auth: PROFESSOR)
  - Body: title, abstract, url, year, tagIds[]
- GET /api/publications → yayın listesi (pagination, tag filtresi)
- GET /api/publications/:id → yayın detayı
- PUT /api/publications/:id → yayın güncelle (auth: owner)
- DELETE /api/publications/:id → yayın sil (auth: owner)

### Başvuru Sistemi
- POST /api/projects/:id/apply → projeye başvur (auth: STUDENT)
  - Body: message (opsiyonel)
  - Kontrol: zaten başvurmuş mu, proje açık mı
- GET /api/projects/:id/applications → başvuruları listele (auth: project owner)
- PUT /api/applications/:id → başvuru durumunu güncelle (auth: project owner)
  - Body: status (ACCEPTED / REJECTED)
- GET /api/my-applications → kendi başvurularımı listele (auth: STUDENT)

### Tag Endpoint'leri
- GET /api/tags → tüm tag'leri listele (category ile gruplanmış)
- GET /api/tags/:id → tag detayı + bu tag'e sahip hocalar ve projeler

### Eşleştirme / Keşif
- GET /api/discover/professors → öğrenci tag'lerine göre önerilen hocalar
  - Öğrencinin tag'leri ile hocaların tag'lerini kesişim skoruna göre sırala
- GET /api/discover/projects → öğrenci tag'lerine göre önerilen projeler
- GET /api/discover/students → hoca tag'lerine göre önerilen öğrenciler (auth: PROFESSOR)

Her endpoint için:
- Zod validation kullan (packages/validation'dan import et)
- Hata yönetimi: uygun HTTP status kodları
- Pagination response formatı: { data: [], meta: { page, limit, total, totalPages } }
- Fastify schema validation ile Swagger auto-doc desteği
```

---

## FAZ 5 — AI Tagleme Servisi (Python)

### Amaç
KeyBERT tabanlı otomatik tag öneri sistemi.

### Claude Code Prompt:

```
FP3 projesinin apps/ai-service dizininde AI tagleme servisini oluştur.

### Kurulum
- Python 3.11+, FastAPI, uvicorn
- KeyBERT, sentence-transformers
- requirements.txt güncelle

### Endpoint'ler

1. POST /api/ai/extract-tags
   - Body: { "text": "makale abstract veya proje açıklaması", "top_n": 5 }
   - İşlem:
     a. KeyBERT ile keyword extraction (keyphrase_ngram_range=(1, 3), top_n=10)
     b. Çıkan keyword'leri veritabanındaki tag havuzuyla eşleştir
        - sentence-transformers ile cosine similarity hesapla
        - Threshold: 0.6 üzeri eşleşmeleri kabul et
     c. Response: { "suggested_tags": [{ "tag_name": "NLP", "confidence": 0.87 }, ...] }

2. POST /api/ai/analyze-profile
   - Body: { "bio": "...", "publications": ["abstract1", "abstract2", ...] }
   - İşlem: Tüm metinleri birleştir, extract-tags ile analiz et
   - Response: { "suggested_tags": [...], "research_areas": ["alan1", "alan2"] }

3. GET /api/ai/health → { "status": "ok", "model_loaded": true }

### Tag Havuzu Yönetimi
- Startup'ta PostgreSQL'den tüm tag'leri çek ve cache'le (in-memory)
- sentence-transformers ile her tag'in embedding'ini önceden hesapla
- POST /api/ai/reload-tags → tag cache'ini yenile (yeni tag eklendiğinde)

### Entegrasyon
- Fastify API'de proxy endpoint: POST /api/ai/suggest-tags
  - Bu endpoint Python servisine istek atar
  - Auth gerekli
  
### Pipeline Akışı
Text → KeyBERT (keyword çıkar) → sentence-transformers (tag eşleştir) → sonuçlar

### Notlar
- İlk model yüklemesi ~30 saniye sürebilir, startup event'inde yükle
- Küçük model kullan: "all-MiniLM-L6-v2" (hızlı, hafif, yeterli)
- CORS ayarı: Fastify API'nin IP/port'una izin ver
- Türkçe ve İngilizce metin desteği olsun
```

---

## FAZ 6 — Web Frontend (Next.js)

### Amaç
Tüm sayfalar ve UI bileşenleri.

### Claude Code Prompt:

```
FP3 projesinin apps/web dizininde Next.js frontend'ini oluştur.

UI: Tailwind CSS + shadcn/ui bileşenleri kullan.
State: TanStack Query (React Query) ile API çağrıları.
Tüm API çağrıları apps/api Fastify backend'ine yapılacak (NEXT_PUBLIC_API_URL env).

### Sayfa Yapısı (App Router)

/                      → Landing page (proje tanıtımı, login/signup butonları)
/(auth)/login          → Giriş formu (email + şifre)
/(auth)/register       → Kayıt formu (email, şifre, isim, rol seçimi, bölüm)
/(auth)/verify-email   → Email doğrulama sayfası
/(dashboard)/          → Ana dashboard (role göre farklı içerik)
/(dashboard)/profile   → Profil düzenleme (bio, tag seçimi, avatar)
/(dashboard)/discover  → Keşif sayfası
  - Öğrenci: Önerilen hocalar ve projeler (tag eşleşmesine göre)
  - Hoca: Önerilen öğrenciler
/(dashboard)/professors     → Hoca listesi (arama + tag filtresi)
/(dashboard)/professors/[id] → Hoca profil detayı
/(dashboard)/projects       → Proje listesi (arama + tag + status filtresi)
/(dashboard)/projects/new   → Yeni proje oluştur (sadece hoca)
/(dashboard)/projects/[id]  → Proje detayı + başvur butonu
/(dashboard)/my-projects    → Hoca: kendi projeleri + başvuruları yönet
/(dashboard)/my-applications → Öğrenci: kendi başvuruları
/(dashboard)/publications   → Yayın listesi
/(dashboard)/publications/new → Yeni yayın ekle (sadece hoca)

### Temel Bileşenler
- TagSelector: çoklu tag seçimi (checkbox grid, kategori bazlı gruplanmış)
- TagBadge: tag gösterim badge'i (renkli, küçük)
- ProfileCard: kullanıcı kartı (avatar, isim, bölüm, tag'ler)
- ProjectCard: proje kartı (başlık, açıklama, tag'ler, status, başvuru sayısı)
- PublicationCard: yayın kartı
- MatchScore: eşleşme skoru gösterimi (yüzde + progress bar)
- Navbar: sol sidebar navigation (role göre farklı menü)
- SearchBar: arama + filtre bileşeni
- Pagination: sayfalama bileşeni
- AITagSuggestion: metin gir → AI'dan tag önerisi al → seç/reddet

### Dashboard İçeriği (Role Göre)
Öğrenci dashboard:
  - "Sana uygun projeler" kartları (discover endpoint)
  - "Sana uygun hocalar" kartları
  - Son başvuruların durumu
  - Quick stats: kaç başvuru, kaç kabul

Hoca dashboard:
  - "Projelerine başvuranlar" bildirimleri
  - "Sana uygun öğrenciler" kartları
  - Aktif proje sayısı, toplam başvuru sayısı
  - Yayın sayısı

### Auth Akışı
- Login/register formları Better Auth client SDK ile
- Session token'ı cookie veya localStorage'da tut
- Protected route'larda middleware ile auth kontrolü
- Unauthorized ise /login'e redirect

### Responsive
- Mobile-first tasarım
- Sidebar mobilde hamburger menu olsun
```

---

## FAZ 7 — Mobil Uygulama (Expo)

### Amaç
Expo ile React Native mobil uygulama.

### Claude Code Prompt:

```
FP3 projesinin apps/mobile dizininde Expo uygulamasını oluştur.

Expo Router (file-based routing) kullan. Aynı Fastify API'ye bağlan.
UI: React Native Paper veya NativeWind (Tailwind for RN) — tercihen NativeWind tutarlılık için.

### Ekran Yapısı (Expo Router)

app/
├── (auth)/
│   ├── login.tsx        → Giriş ekranı
│   ├── register.tsx     → Kayıt ekranı
│   └── verify-email.tsx → Email doğrulama
├── (tabs)/
│   ├── _layout.tsx      → Tab navigator (Home, Discover, Projects, Profile)
│   ├── index.tsx        → Dashboard (role göre)
│   ├── discover.tsx     → Keşif (önerilen hocalar/öğrenciler/projeler)
│   ├── projects/
│   │   ├── index.tsx    → Proje listesi
│   │   └── [id].tsx     → Proje detayı
│   ├── professors/
│   │   ├── index.tsx    → Hoca listesi
│   │   └── [id].tsx     → Hoca profili
│   └── profile/
│       ├── index.tsx    → Kendi profilim
│       └── edit.tsx     → Profil düzenleme
├── my-applications.tsx  → Başvurularım (öğrenci)
├── my-projects.tsx      → Projelerim (hoca)
└── _layout.tsx          → Root layout (auth check)

### Paylaşımlı API Layer
- packages/shared-types'dan tipleri import et
- API çağrıları için bir api client oluştur (fetch wrapper + auth token header)
- TanStack Query kullan (web ile aynı hook mantığı)

### Mobil Özel Özellikler
- Pull-to-refresh proje ve hoca listelerinde
- Push notification altyapısı (Expo Notifications — ileride kullanılacak)
- Secure storage ile token saklama (expo-secure-store)
- Splash screen ve app icon placeholder

### Notlar
- Web'deki tüm core özellikler mobilde de olsun
- AI tag suggestion mobilde de çalışsın
- Yeni proje oluşturma ve yayın ekleme mobilde de olsun
```

---

## FAZ 8 — Entegrasyon, Test ve Deploy

### Amaç
Tüm servisleri birbirine bağla, test et ve deploy et.

### Claude Code Prompt:

```
FP3 projesini entegre et, test et ve deploy'a hazırla.

### 1. Servis Entegrasyonu
- Fastify API → Python AI Service bağlantısını test et
- Next.js → Fastify API CORS ayarlarını doğrula
- Expo → Fastify API bağlantısını test et (fiziksel cihaz için IP ayarı)
- Better Auth session akışını web ve mobilde test et

### 2. Environment Konfigürasyonu
.env.production oluştur:
  DATABASE_URL=neon_connection_string
  BETTER_AUTH_SECRET=xxx
  JWT_SECRET=xxx
  AI_SERVICE_URL=http://ai-service:5000
  NEXT_PUBLIC_API_URL=https://api.fp3.xxx
  CORS_ORIGINS=https://fp3.xxx,exp://xxx

### 3. Docker
docker-compose.yml oluştur:
  - api: Fastify (Node.js)
  - ai-service: Python FastAPI
  - Neon PostgreSQL dışarıda (managed)
  
Her servis için Dockerfile:
  - apps/api/Dockerfile (Node.js multi-stage build)
  - apps/ai-service/Dockerfile (Python, model cache'i için volume)

### 4. Deploy Planı
- Web (Next.js): Vercel'e deploy
  - vercel.json konfigürasyonu
  - Environment variables ayarla
  
- API (Fastify): Railway veya Render'a deploy
  - Procfile veya railway.toml
  - Health check endpoint: /health
  
- AI Service (Python): Railway veya Render'a deploy
  - Model dosyaları ilk startup'ta indirilecek
  - Health check: /api/ai/health

- Database: Neon PostgreSQL (zaten managed)

### 5. Temel Test Senaryoları
Bir test script (test/e2e.ts) yaz:
  1. Hoca kaydı → email doğrulama → giriş
  2. Hoca profil güncelleme + tag ekleme
  3. Hoca yayın ekleme → AI tag önerisi alma
  4. Hoca proje oluşturma
  5. Öğrenci kaydı → giriş → tag ekleme
  6. Öğrenci keşif sayfası → önerilen projeler
  7. Öğrenci projeye başvuru
  8. Hoca başvuru kabul/red
  9. Eşleştirme skorlarının doğruluğu

### 6. README.md
Root'ta kapsamlı README yaz:
  - Proje açıklaması
  - Tech stack
  - Kurulum adımları (dev ortamı)
  - Environment variables açıklaması
  - API dokümantasyonu linki
  - Deploy talimatları
```

---

## Faz Sıralaması ve Bağımlılıklar

```
FAZ 1 (Monorepo) ──→ FAZ 2 (DB) ──→ FAZ 3 (Auth) ──→ FAZ 4 (API)
                                                           │
                                                           ├──→ FAZ 5 (AI Service)
                                                           ├──→ FAZ 6 (Web)
                                                           └──→ FAZ 7 (Mobil)
                                                                    │
                                                        FAZ 8 (Entegrasyon) ←──┘
```

Faz 5, 6, 7 paralel yapılabilir (hepsi Faz 4'e bağımlı). Faz 8 her şey bittikten sonra.

---

## Tahmini Süre

| Faz | Süre |
|-----|------|
| Faz 1 — Monorepo | 1-2 gün |
| Faz 2 — Database | 1 gün |
| Faz 3 — Auth | 2-3 gün |
| Faz 4 — API | 3-5 gün |
| Faz 5 — AI Service | 2-3 gün |
| Faz 6 — Web Frontend | 5-7 gün |
| Faz 7 — Mobil | 4-6 gün |
| Faz 8 — Entegrasyon | 2-3 gün |
| **Toplam** | **~3-4 hafta** |
