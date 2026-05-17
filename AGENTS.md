# AGENTS.md — FP3 için AI Asistan Bağlamı

Bu dosya, AI/coding asistanlarının proje üzerinde verimli çalışabilmesi için
hazırlanmıştır. Kullanıcıya yönelik açıklamalar için → [`README.md`](./README.md).
Detaylı dokümantasyon için → [`docs/`](./docs/).

---

## 🎯 Proje Özeti

**FP3** — Üniversite öğrencileri ve akademisyenler arasında **tag tabanlı
akıllı eşleştirmeyle** makale/proje ortaklığı kuran platform.

- **Üniversite:** Ostim Teknik Üniversitesi
- **Mail Domain:** Sadece `@ostimteknik.edu.tr` mailleri kabul edilir
- **Roller:** `STUDENT` (öğrenci) ve `PROFESSOR` (akademisyen)

---

## 🛠 Tech Stack

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| **Monorepo** | Turborepo + pnpm workspaces | pnpm 9.15.4 |
| **Web** | Next.js (App Router) + Tailwind v4 + shadcn/ui | 16.1.x |
| **API** | Fastify + Prisma 6 + Better Auth | 5.2.x |
| **AI Service** | Python FastAPI + KeyBERT + sentence-transformers | `all-MiniLM-L6-v2` |
| **Mobile** | Expo (React Native) + Expo Router | SDK 54 |
| **DB** | PostgreSQL 17 (lokal Homebrew/Windows installer) | — |
| **Auth** | Better Auth + Bearer plugin | 1.4.x |
| **State** | TanStack Query | 5.x |
| **Icons** | Phosphor Icons | — |
| **Docs UI** | Scalar API Reference (hem API hem AI için) | — |

---

## 🔌 Port Standardı (kritik)

| Servis | Port |
|--------|------|
| Web | **3000** |
| API | **3001** |
| AI | **3002** |
| Postgres | 5432 |
| Expo Metro | 8081 |

Tüm hardcoded port'lar `.env` dosyalarıyla override edilebilir.
Yeni bir yerde port referansı eklerken bu listeye sadık kal.

---

## 📁 Proje Yapısı

```
fp3/
├── apps/
│   ├── web/                 Next.js 16 (App Router) — :3000
│   │   ├── src/app/         Sayfalar
│   │   │   ├── (auth)/      login + signup
│   │   │   └── (dashboard)/ ana uygulama (sidebar + AuthProvider)
│   │   ├── src/components/  React bileşenleri (ai-tag-suggestions,
│   │   │                    invite-modal, project-card, professor-team-wizard, ...)
│   │   └── src/lib/         api.ts, auth-context.tsx, query-client.ts
│   │
│   ├── api/                 Fastify — :3001
│   │   ├── src/routes/      auth, profile, projects, applications,
│   │   │                    invitations, professor-applications,
│   │   │                    matching, team-ideas, discover, ai,
│   │   │                    professors, students, tags, publications,
│   │   │                    saved-matches
│   │   ├── src/lib/         prisma, auth, swagger, schemas
│   │   ├── src/middleware/  requireAuth, requireRole, getSession
│   │   └── prisma/          schema.prisma + migrations + seed
│   │
│   ├── ai-service/          Python FastAPI — :3002
│   │   ├── main.py          KeyBERT + sentence-transformers
│   │   └── .venv/           Python sanal ortamı
│   │
│   └── mobile/              Expo — :8081 (Metro)
│       ├── app/(auth)/      login + signup
│       ├── app/(app)/       dashboard sayfaları
│       └── src/             components + lib
│
├── packages/
│   ├── shared-types/        TS tipleri (User, Project, ProjectMember, ...)
│   ├── validation/          Zod şemaları (createProjectSchema, ...)
│   └── config/              TSConfig'ler
│
├── docs/                    Detaylı dokümantasyon (`docs/README.md` indeks)
├── README.md                Public proje sayfası
├── setup.md                 Windows kurulum (gitignored)
├── CONTRIBUTING.md          Katkı rehberi
├── turbo.json, pnpm-workspace.yaml, package.json
```

---

## 🚀 Hızlı Komutlar

```bash
# Kurulum (ilk seferinde)
pnpm install
cd apps/api && pnpm prisma:generate && pnpm prisma:migrate && pnpm prisma:seed && cd ../..
cd apps/ai-service && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ../..

# Geliştirme
pnpm dev                # web + api + mobile (turbo)
pnpm dev:web            # sadece web
pnpm dev:api            # sadece API
pnpm dev:ai             # sadece AI servisi
pnpm dev:mobile         # sadece Expo

# Bakım
pnpm clean-ports        # 3000,3001,3002,8081 portlarını öldür
pnpm dev:fresh          # clean-ports + dev
pnpm type-check         # tüm paketlerde tsc --noEmit
pnpm build              # production build
pnpm format             # Prettier

# DB (apps/api içinde)
pnpm prisma:generate    # Prisma Client (→ src/generated/prisma)
pnpm prisma:migrate
pnpm prisma:seed
pnpm prisma:studio      # :5555
```

---

## 📊 Veri Modeli (13 model — özet)

```
User ──┬── UserTag ── Tag
       │
       ├── Project (owner = PROFESSOR)
       │     ├── ProjectTag ── Tag
       │     ├── ProjectMember ── User      ← kabul edilen başvuru/davet → buraya
       │     ├── Application ── User        ← kullanıcı → projeye başvuru
       │     └── ProjectInvite ── User      ← owner → kullanıcıyı davet
       │
       ├── ProfessorApplication             ← öğrenci → hocaya proje önerisi
       │     └── createdProjectId → Project (kabul edilirse otomatik)
       │
       ├── Publication ── PublicationTag ── Tag
       │
       ├── TeamIdea + TeamInvite            ← matching wizard planlama kaydı
       │
       └── SavedMatch                       ← öğrencinin kaydettiği hocalar
```

**Önemli noktalar:**
- `Project` artık `studentSlots` (0–50) ve `professorSlots` (1–20) ile ayrı kontenjana sahip — eski `maxMembers` kaldırıldı.
- Owner otomatik `ProjectMember` (role: PROFESSOR) olarak eklenir.
- Bir ProjectInvite veya Application kabul edildiğinde `ProjectMember` **transaction'da** oluşur (`upsert`).
- ProfessorApplication kabul edildiğinde **YENİ bir Project + 2 ProjectMember** (öğrenci + hoca) atomik yaratılır.

Detay → [`docs/database.md`](./docs/database.md)

---

## 🔌 API Endpoint'leri (15 tag · 41 endpoint)

Tam liste için **Scalar UI**: http://localhost:3001/docs
Detaylı dokümantasyon: [`docs/api.md`](./docs/api.md)

### Auth — `routes/auth.ts` (Better Auth)
- `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email`,
  `POST /api/auth/sign-out`, `GET /api/auth/get-session`

### Profil — `routes/profile.ts`
- `GET /api/profile`, `PUT /api/profile`, `PUT /api/profile/tags`, `GET /api/profile/:id`

### Projeler — `routes/projects.ts`
- `GET /api/projects` (filtre + pagination), `GET /api/projects/:id`,
  `POST /api/projects` (PROFESSOR), `PUT /api/projects/:id` (owner),
  `DELETE /api/projects/:id` (owner), `GET /api/my-projects`

### Başvurular — `routes/applications.ts`
- `POST /api/projects/:id/apply`, `GET /api/projects/:id/applications`,
  `PUT /api/applications/:id` (owner), `GET /api/my-applications`,
  `GET /api/applications/incoming` (PROFESSOR; status filter + counts)

### Davetler — `routes/invitations.ts`
- `POST /api/projects/:id/invite` (owner), `GET /api/invitations`,
  `PUT /api/invitations/:id` (recipient), `GET /api/projects/:id/invitations`,
  `GET /api/users/search` (davet hedef seçimi)

### Hoca Başvuruları — `routes/professor-applications.ts`
- `POST /api/professor-applications` (STUDENT),
  `GET /api/professor-applications/incoming` (PROFESSOR),
  `GET /api/professor-applications/mine` (STUDENT),
  `PUT /api/professor-applications/:id` (PROFESSOR — kabul = yeni Project)

### Eşleştirme & Ekip Kurma — `routes/matching.ts`, `routes/team-ideas.ts`
- `POST /api/match/professors` (STUDENT için)
- `POST /api/match/team` (PROFESSOR için ekip eşleştirme)
- `POST /api/team-ideas` — **TeamIdea + Project + ProjectInvite'lar atomik**
- `GET /api/team-ideas/my`

### Keşif — `routes/discover.ts`
- `GET /api/discover/professors`, `GET /api/discover/projects`, `GET /api/discover/students`

### AI — `routes/ai.ts` (proxy → Python `:3002`)
- `POST /api/ai/suggest-tags` → `/api/ai/extract-tags`
- `POST /api/ai/analyze-profile`
- `GET /api/ai/health`, `POST /api/ai/reload-tags`

### Diğer
- **Yayınlar** — `routes/publications.ts`
- **Tag'ler** — `routes/tags.ts`
- **Akademisyen/Öğrenci listesi** — `routes/professors.ts`, `routes/students.ts`
- **Kayıtlı eşleşmeler** — `routes/saved-matches.ts`

---

## 🎨 Web Sayfaları (Next.js App Router)

```
/                           # Landing
/login, /signup             # (auth) — Better Auth

/(dashboard)/
  ├── dashboard/            # Ana sayfa
  ├── profile/              # Bio + tag adımlı düzenleme (AI önerisi var)
  ├── discover/             # Öneri akışları (hoca/proje/öğrenci)
  ├── matching/             # Hoca → Ekip wizard | Öğrenci → Hoca matching
  ├── professors/           # Hoca listesi + [id] detay
  ├── students/             # Öğrenci listesi (hoca için)
  ├── projects/             # Proje liste + [id] detay + new
  │   └── [id]              # Ekip kartı (gruplu üyeler + slot editor) +
  │                         #   Davet Ettiklerin kartı + Başvurular
  ├── my-projects/          # Sahibi + üyesi olduklarım
  ├── my-applications/      # Projelere gönderdiğim başvurular
  ├── my-professor-applications/  # Hocalara gönderdiğim proje önerileri
  ├── incoming-applications/      # 📥 BİRLEŞİK GELEN KUTUSU
  ├── invitations/                # → redirects to incoming-applications
  ├── professor-applications/     # → redirects to incoming-applications
  ├── publications/         # Yayın liste + new
  └── saved-matches/        # Kaydedilen hocalar
```

### Önemli component'ler

| Component | Görev |
|-----------|-------|
| `AiTagSuggestions` | Metinden AI tag önerisi (kullanıldığı yerler: projects/new, publications/new, profile, professor-team-wizard) |
| `InviteModal` | Paylaşımlı davet modali (my-projects + projects/[id]) |
| `ProjectCard` | Liste kartı; owner için inline delete |
| `ProfessorTeamWizard` | 5 adımlı ekip kurma wizard'ı |
| `MemberGroup` | Proje detayında gruplu üye + slot editör |
| `InvitesCard` | Proje detayında "Davet Ettiklerin" |

Detay → [`docs/web-app.md`](./docs/web-app.md)

---

## 📥 Birleşik Gelen Kutusu (önemli design noktası)

`/incoming-applications` — eskiden 3 ayrı sayfa olan akışları tek bir
**sol rail + içerik paneli** UI'ında birleştirir.

| Sub-inbox | Hoca | Öğrenci |
|-----------|------|---------|
| **Proje Başvuruları** | ✅ açık projelerime gelen başvurular | — |
| **Öğrenci Talepleri** | ✅ doğrudan bana gelen proje önerileri | — |
| **Davetlerim** | ✅ | ✅ |

`/invitations` ve `/professor-applications` → `/incoming-applications` redirect.

Detay → [`docs/features/inbox.md`](./docs/features/inbox.md)

---

## 🧩 Paylaşımlı Paketler

```ts
// Tipler
import { User, Project, ProjectMember, Application } from "@fp3/shared-types"

// Zod şemaları
import { createProjectSchema, updateProjectSchema } from "@fp3/validation"

// TSConfig
{ "extends": "@fp3/config/tsconfig.base.json" }
```

---

## ✅ Kodlama Kuralları

| Kural | Detay |
|-------|-------|
| **TypeScript** | Strict, her pakette `pnpm type-check` |
| **UI Bileşenleri** | shadcn/ui + Tailwind v4 + Phosphor Icons |
| **Primary renk** | Indigo (`#6366f1`) |
| **Status renkleri** | amber (PENDING) · emerald (ACCEPTED) · rose (REJECTED) |
| **API response** | `{ success, data?, error? }`; sayfalı → `meta` ile |
| **Auth middleware** | `requireAuth` veya `requireRole("PROFESSOR"|"STUDENT")` |
| **Dil** | UI Türkçe · kod İngilizce |
| **Dosya isimleri** | kebab-case bileşenler (`invite-modal.tsx`), camelCase fonksiyonlar |
| **Phosphor weight** | `fill` aktif/seçili, `duotone` normal, `regular` çizgi |

---

## ⚠️ Önemli Tuzaklar (geçmişte yandık, dikkat)

### 1. Fastify response schema field drop
`fast-json-stringify` strict schema'da tanımsız alanları **siler**.
`Project` ↔ `Application` arasında circular ref var. Nested
`members`/`applications`/`_count` döndüren GET endpoint'lerde
**response schema kullanma** (sadece `400`, `404` gibi error'ları kalsın).

Etkilenen route'lar:
- `GET /api/projects`, `GET /api/projects/:id`, `GET /api/my-projects`
- `GET /api/discover/projects`

### 2. Swagger encapsulation
`@fastify/swagger` plugin'i route'ları yakalamak için **`fastify-plugin` (`fp`)
ile sarmalanmalı**. Yoksa OpenAPI spec boş çıkar, Scalar UI'da tag'ler
görünür ama altları boş kalır.

`apps/api/src/lib/swagger.ts` → `export const setupSwagger = fp(swaggerPlugin, ...)`

### 3. Empty body JSON parser
Custom content-type parser boş body'de `JSON.parse("")` atıyordu → DELETE
500. Çözüm: `apps/api/src/server.ts`'te boş body → `done(null, undefined)`.

### 4. Frontend Content-Type
`apps/web/src/lib/api.ts` body olmayan istekte **Content-Type
göndermez** (yukarıdaki parser'la birlikte güvenli olur).

### 5. iOS cookie comma-merge
NSURLSession bazen Set-Cookie'leri virgülle birleştiriyor. Server'da
`onRequest` hook: Bearer geldiyse Cookie'yi sil, yoksa virgüllü cookie'yi
`; ` ile normalize et.

### 6. tsx watch reload sorunu
Bazen tsx watch dosya değişikliklerini yakalamıyor (özellikle
schemas.ts gibi transitive import'lar). API güncellenmiyorsa:
```bash
pkill -9 -f "tsx.*server"
pnpm dev:api
```

### 7. AI tag cache
Yeni Tag eklenince Python AI cache stale olur. UI'dan yeni tag
yaratıldığında `POST /api/ai/reload-tags` çağrılmalı.

### 8. Better Auth `@ostimteknik.edu.tr` zorunluluğu
Sign-up'ta domain kontrolü Zod ile. Test için seed kullanıcılarını kullan.

---

## 🔧 Faydalı Komutlar

```bash
# Type-check
pnpm type-check

# Tek dosya/paket type-check
cd apps/api && pnpm type-check
cd apps/web && pnpm type-check

# Port temizliği
pnpm clean-ports

# Yeni Prisma migration
cd apps/api && pnpm prisma migrate dev --name <descriptive_name>

# Prisma Studio (görsel DB)
cd apps/api && pnpm prisma:studio

# API'yi yeniden başlat (tsx watch sıkıştıysa)
pkill -9 -f "tsx.*server" && pnpm dev:api
```

---

## 📚 Daha Fazla Detay

- [`README.md`](./README.md) — public proje sayfası
- [`docs/README.md`](./docs/README.md) — doküman indeksi
- [`docs/architecture.md`](./docs/architecture.md) — servisler & veri akışı
- [`docs/database.md`](./docs/database.md) — şema detayı
- [`docs/api.md`](./docs/api.md) — endpoint referansı
- [`docs/ai-service.md`](./docs/ai-service.md) — AI algoritması & UI entegrasyonu
- [`docs/auth.md`](./docs/auth.md) — Better Auth akışları
- [`docs/web-app.md`](./docs/web-app.md), [`docs/mobile-app.md`](./docs/mobile-app.md)
- [`docs/features/inbox.md`](./docs/features/inbox.md), [`docs/features/matching.md`](./docs/features/matching.md), [`docs/features/invitations.md`](./docs/features/invitations.md)
- **API Docs UI**: http://localhost:3001/docs (Scalar)
- **AI Docs UI**:  http://localhost:3002/docs (Scalar, aynı görünüm)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — katkı rehberi
- [`setup.md`](./setup.md) — Windows kurulum (gitignored)
