# Mimari

FP3 dört bağımsız servisten oluşan bir **monorepo**dur. Tüm paketler `pnpm`
workspace'leri ile yönetilir; Turborepo build/dev orchestration sağlar.

## 🗺 Genel Görünüm

```
┌─────────────────────┐     ┌─────────────────────┐
│  Next.js Web        │     │  Expo Mobile        │
│  apps/web :3000     │     │  apps/mobile        │
└──────────┬──────────┘     └──────────┬──────────┘
           │                            │
           │ fetch /api/*               │ fetch /api/* (Bearer)
           ▼                            ▼
       ┌──────────────────────────────────────┐
       │  Fastify API                          │
       │  apps/api  :3001                      │
       │  - Better Auth (session + bearer)     │
       │  - Prisma ORM                         │
       └──────┬───────────────────────┬────────┘
              │                       │
              ▼                       ▼ (proxy)
      ┌──────────────┐         ┌──────────────────┐
      │  PostgreSQL   │         │  Python AI       │
      │  Homebrew     │         │  FastAPI :3002   │
      │  :5432        │         │  KeyBERT +       │
      │               │         │  sentence-       │
      │               │◀────────│  transformers    │
      └──────────────┘  (tag    └──────────────────┘
                         cache)
```

## 📦 Servisler

| Servis | Klasör | Teknoloji | Port | Açıklama |
|--------|--------|-----------|------|----------|
| Web | `apps/web` | Next.js 16 (App Router) + Tailwind v4 + shadcn/ui | `3000` | Kullanıcı dashboard'u |
| API | `apps/api` | Fastify 5 + Prisma 6 + Better Auth | `3001` | Tüm iş mantığı, auth, DB CRUD |
| AI | `apps/ai-service` | FastAPI + KeyBERT + `all-MiniLM-L6-v2` | `3002`† | Tag önerisi, profil analizi |
| Mobile | `apps/mobile` | Expo SDK 52 + Expo Router | Expo dev server | iOS/Android uygulaması |

> † macOS'ta `5000` portu AirPlay Receiver tarafından tutulur; FP3 port
> standardında AI servisi **3002**'de çalışır.
> `apps/api/.env`'de `AI_SERVICE_URL=http://localhost:3002` set edilmiş olmalı.

## 📁 Monorepo Yapısı

```
fp3/
├── apps/
│   ├── api/              Fastify backend (TypeScript)
│   ├── web/              Next.js dashboard
│   ├── mobile/           Expo app
│   └── ai-service/       Python FastAPI (kendi venv'i)
├── packages/
│   ├── shared-types/     TS tipleri (User, Project, Application, ...)
│   ├── validation/       Zod şemaları (paylaşılan)
│   └── config/           TSConfig base'leri
├── docs/                 Bu klasör
├── turbo.json            Turborepo task tanımları
├── pnpm-workspace.yaml   Workspace bağları
└── package.json
```

## 🔄 Veri Akışı: Tipik İstek

1. Kullanıcı tarayıcıdan `/projects/abc` sayfasını açar.
2. Next.js, sunucu tarafında **yoktur** — sayfa client component, doğrudan
   `fetch("/api/projects/abc")` ile API'ye gider (cookie ile auth).
3. API, Better Auth ile session'ı çözer, Prisma ile DB'ye sorar, JSON döner.
4. UI **TanStack Query** ile cache'ler; aynı veri başka yerlerde tekrar
   istenmez.
5. Mutation sonrası ilgili query'ler invalidate edilir; ekran tazelenir.

Bazı endpoint'ler ayrıca **AI servisine proxy** yapar:

```
Web  →  /api/ai/suggest-tags  →  Fastify  →  Python /api/ai/extract-tags
                                                  │
                                                  ▼
                                          tag embedding cache + cosine sim
```

Detay: [ai-service.md](./ai-service.md).

## 🔌 Port Haritası (lokal geliştirme)

| Port | Servis | Notlar |
|------|--------|--------|
| 3000 | Next.js web | `pnpm dev:web` veya kök `pnpm dev` |
| 3001 | Fastify API | `pnpm dev:api` |
| 3002 | Python AI | `pnpm dev:ai`  (veya `cd apps/ai-service && python main.py`) |
| 5432 | PostgreSQL | Homebrew servisi (`brew services list`) |
| 8081 | Expo Metro | `pnpm dev:mobile` |
| 19000-19002 | Expo (LAN, tunnel) | İhtiyaca göre |

## 🔐 Auth Akışı (özet)

- Web: Better Auth session cookie (`fp3.*`) HttpOnly + SameSite=Lax.
- Mobile: Better Auth **Bearer plugin** üzerinden `Authorization: Bearer <token>`.
- E-posta domain filtresi `@ostimteknik.edu.tr` — Better Auth'un `signUp` hook'unda.

Detay: [auth.md](./auth.md).

## 🧬 Veri Modeli (özet)

13 ana tablo. En kritik 5'i:

- **User** — STUDENT / PROFESSOR rolü, departman, yıl, tags ilişkisi.
- **Project** — Owner (hoca), studentSlots / professorSlots kontenjanları,
  status (OPEN / IN_PROGRESS / CLOSED).
- **ProjectMember** — Bir kullanıcının bir projeye dahil olduğunu gösterir.
- **Application** — Bir kullanıcının bir projeye başvurusu (PENDING / ACCEPTED / REJECTED).
- **ProjectInvite** — Owner'ın bir kullanıcıyı projeye davet etmesi.

Detay: [database.md](./database.md).

## 🧰 Geliştirme Komutları

```bash
pnpm dev                # Turborepo: web + api + mobile (paralel)
pnpm dev:web            # Sadece Next.js
pnpm dev:api            # Sadece Fastify
pnpm type-check         # Tüm paketlerde tsc --noEmit
pnpm build              # Production build
```

## ⚠️ Sık Karşılaşılan Tuzaklar

Bu listeyi de [development.md](./development.md) içinde detaylandırdık. Hızlı
özet:

1. **`tsx watch` çift instance**: API geliştirirken bazen ölmüş watcher'lar
   takılı kalıyor. `pkill -9 -f "tsx.*server"` ile temizle.
2. **`fast-json-stringify` field düşürme**: GET endpoint'lerinde nested
   `members` / `applications` / `_count` döndürmek için response schema
   kaldırılmıştır. Yeni endpoint eklerken aynı tuzağa düşme.
3. **Empty body JSON parse**: Custom content-type parser boş body'yi
   `undefined` döndürür (DELETE 500 hatasını önlemek için).
4. **Tag cache stale**: Yeni tag eklendiğinde AI servisi yenilenmeli
   (`POST /api/ai/reload-tags`).
