# Web Uygulaması

Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui. State management
için **TanStack Query 5**, formlar için native React state + Zod.

## 📁 Yapı

```
apps/web/src/
├── app/
│   ├── (auth)/                  → login + signup (auth layout)
│   ├── (dashboard)/             → ana uygulama (sidebar layout)
│   │   ├── dashboard/           → ana sayfa
│   │   ├── matching/            → eşleştirme / ekip kurma wizard
│   │   ├── discover/            → öneri keşif
│   │   ├── professors/          → hoca listesi + detay
│   │   ├── students/            → öğrenci listesi (sadece hoca için)
│   │   ├── projects/            → proje liste + [id] detay + new
│   │   ├── publications/        → yayın liste + new
│   │   ├── my-projects/         → projelerim
│   │   ├── my-applications/     → projelere başvurularım (öğrenci)
│   │   ├── my-professor-applications/ → hocalara yolladığım talepler
│   │   ├── incoming-applications/     → 📨 BİRLEŞİK GELEN KUTUSU
│   │   ├── invitations/         → → /incoming-applications (redirect)
│   │   ├── professor-applications/ → → /incoming-applications (redirect)
│   │   ├── profile/             → kendi profilim
│   │   └── saved-matches/       → kaydedilenler
│   ├── layout.tsx
│   └── page.tsx                 → landing
├── components/
│   ├── ui/                      → shadcn primitives (button, card, ...)
│   ├── ai-tag-suggestions.tsx   → AI öneri kartı
│   ├── invite-modal.tsx         → ortak davet modali
│   ├── project-card.tsx         → liste kartı (delete dahil)
│   ├── professor-team-wizard.tsx → /matching hoca için wizard
│   ├── sidebar-nav.tsx          → web sidebar
│   ├── mobile-nav.tsx           → mobil hamburger
│   ├── tag-badge.tsx, tag-selector.tsx
│   └── match-score.tsx
├── lib/
│   ├── api.ts                   → fetch wrapper + tüm endpoint helper'ları
│   ├── auth-context.tsx         → AuthProvider + useAuth
│   ├── query-client.ts          → TanStack Query config
│   └── utils.ts                 → cn() vs.
└── styles/
    └── globals.css              → Tailwind + theme variables
```

## 🛣 Route Grupları

| Grup | Layout | Açıklama |
|------|--------|----------|
| `(auth)` | `app/(auth)/layout.tsx` | Sadece login/signup. Sidebar yok. |
| `(dashboard)` | `app/(dashboard)/layout.tsx` | Sidebar + mobile nav + AuthProvider. |

Login/signup haricindeki tüm sayfalar `(dashboard)` altında. **Sidebar
linkleri rol bazlı filtrelenir** (`sidebar-nav.tsx` içinde `studentLinks` /
`professorLinks` ayrı listeler).

## 🧩 Anahtar Component'ler

### `AiTagSuggestions`
AI ile tag önerisi. Detay → [ai-service.md](./ai-service.md#-ui-entegrasyonu).
Kullanıldığı yerler:
- `projects/new/page.tsx`
- `publications/new/page.tsx`
- `profile/page.tsx` (bio adımında)
- `professor-team-wizard.tsx` (tags step)

### `InviteModal` (`invite-modal.tsx`)
Proje sahibinin başkalarını davet etmesi için **paylaşımlı modal**.
İki yerde kullanılır:
- `my-projects/page.tsx` (kart başına "Davet Et")
- `projects/[id]/page.tsx` (detay sayfasında "Üye Davet Et")

Özellikler:
- Rol pills (Tümü / Öğrenci / Akademisyen) + kontenjan hint'leri
- Arama (isim/email/departman)
- "Zaten üye" / "Kontenjan dolu" / "Davet edildi" rozetleri
- Modal kapanmadan birden fazla kişiyi davet edebilme

### `ProjectCard`
Listede tek proje gösterimi (`projects/`, `my-projects/`, `discover/`).
- Owner için **inline delete** (🗑 → ✓/✗ confirm)
- Match score (varsa)
- Davet bekleyenler için badge (my-projects'te)

### `ProfessorTeamWizard`
Matching sayfası hocalar için 5 adımlık wizard:
1. **Fikir** — title + description
2. **Kontenjan** — kaç hoca / öğrenci
3. **Alan** — tag seçimi (AI önerisi dahil)
4. **Hoca** — önerilen hocaları seç
5. **Ekip (sonuç)** — önerilen öğrencilerden seç → kaydet (Project + ProjectInvite üretir)

Akış: [features/matching.md](./features/matching.md)

## 🌐 Veri Erişimi

### `lib/api.ts`

`api()` fetch wrapper'ı:
- Otomatik `credentials: "include"` (cookie)
- Body varsa `Content-Type: application/json` ekler, yoksa **eklemez**
  (Fastify empty-body parse hatasını önler)
- Hata response'unu `Error` olarak fırlatır

Namespace'ler:
```ts
authApi.signIn(...)
profileApi.getMe()
projectsApi.list() / .getById() / .create() / .update() / .delete() / .mine()
applicationsApi.apply(...) / .updateStatus() / .incoming() / .myApplications()
invitationsApi.send() / .mine() / .respond() / .listForProject()
professorApplicationsApi.send() / .incoming() / .mine() / .respond()
usersApi.search()                       // davet hedefi seçimi için
tagsApi.list()
discoverApi.professors() / .projects() / .students()
matchingApi.matchProfessors() / .matchTeam()
teamIdeasApi.create() / .my()
savedMatchesApi.save() / .unsave() / .list() / .ids()
aiApi.suggestTags() / .analyzeProfile()
```

### TanStack Query

Tüm `useQuery` çağrıları aynı pattern:
```ts
const { data, isLoading } = useQuery({
  queryKey: ["projects", filter, page],
  queryFn: () => projectsApi.list(`page=${page}...`),
});
```

Mutation sonrası ilgili key'ler invalidate edilir:
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["my-projects"] });
  queryClient.invalidateQueries({ queryKey: ["project", id] });
}
```

**Optimistic update** kullanılan yerler:
- Slot capacity editor (`projects/[id]/page.tsx`)
- Tag seçim (TagSelector)

## 🎨 Tasarım Sistemi

- **Primary**: Indigo (`hsl(238 84% 67%)`) — tüm aksiyon butonları
- **Status renkleri**: amber (pending), emerald (accepted), rose (rejected)
- **Tipografi**: Geist Sans + Mono
- **İkonlar**: Phosphor Icons (`@phosphor-icons/react`)
- **Border radius**: `lg` (12px) varsayılan; küçük rozet/pill için `full`

## 🚀 Çalıştırma

```bash
pnpm dev:web                 # :3000
# veya
pnpm dev                     # web + api + mobile turbo
```

### Environment

```env
# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## ✅ Önemli Convention'lar

- **Sayfalar `"use client"`** — App Router olsa da çoğu sayfa client; SSR
  gerektiren bir senaryo yok.
- **Türkçe UI / İngilizce kod** — Component prop'ları İngilizce, görünür
  metinler Türkçe.
- **kebab-case** dosya adları (`invite-modal.tsx`); **camelCase**
  fonksiyonlar (`getInitials`).
- **Phosphor weight**: aktif/seçili `fill`, normal `duotone`, çizgi `regular`.
