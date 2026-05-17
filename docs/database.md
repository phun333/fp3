# Veritabanı

PostgreSQL üzerinde **Prisma 6** ORM ile çalışır. Lokal kurulum **Docker
kullanmaz** — Homebrew servisi olarak `postgresql@17` çalışır.

## 🔌 Bağlantı

### Lokal (geliştirme)

```env
# apps/api/.env
DATABASE_URL="postgresql://postgres:<parola>@localhost:5432/fp3"
```

- Host: `localhost:5432`
- Auth: `trust` (parolasız, sadece local socket)
- Servis kontrolü: `brew services list | grep postgres`

### Production (planlanan)

Herhangi bir managed PostgreSQL servisi kullanılabilir.
Migration ve kod değişmez, sadece `DATABASE_URL` swap edilir.

## 📊 Veri Modeli — Ana Tablolar

13 model. Sınıflara ayrılmış görünüm:

### 1. Kimlik & Profil
- **User** — STUDENT veya PROFESSOR. `email` (unique), `name`, `role`,
  `department`, `year` (öğrenci sınıfı, 1–4), `bio`, `avatarUrl`.
- **Tag** — İlgi alanı etiketi. `name` (unique), `category` (örn.
  "AI/ML", "Web", "Yazılım Mühendisliği").
- **UserTag** — Bir kullanıcının seçtiği tag'ler (m:n).

### 2. Projeler & Üyelik
- **Project** — Hocanın açtığı veya matching wizard'ının ürettiği proje.
  - `ownerId` — sahibi (her zaman PROFESSOR)
  - `studentSlots` — öğrenci kontenjanı (0–50)
  - `professorSlots` — akademisyen kontenjanı (1–20)
  - `status` — `OPEN | IN_PROGRESS | CLOSED`
- **ProjectMember** — Bir kullanıcı bir projeye dahil olunca burada satır
  oluşur. Owner da otomatik üye olur (role = PROFESSOR). Kabul edilen
  başvurular ve davetler de buraya yazılır. **`@@unique([projectId, userId])`**.
- **ProjectTag** — Projenin tag'leri (m:n).

### 3. Başvuru & Davet Sistemi
- **Application** — Bir kullanıcının bir projeye doğrudan başvurusu (öğrenci
  veya hoca).
  - `status` — `PENDING | ACCEPTED | REJECTED`
  - Kabul edilince **otomatik olarak ProjectMember oluşur**
    (transactional, [api.md](./api.md) → `PUT /api/applications/:id`).
- **ProjectInvite** — Proje sahibinin başkasını davet etmesi.
  - `invitedRole` — davet edilen rol (öğrenci/hoca)
  - `inviterId` — daveti gönderen
  - Kabul edilince → ProjectMember oluşur (kontenjan kontrol edilir).
- **ProfessorApplication** — Öğrencinin bir hocaya **proje önerisi**.
  - Hoca kabul ederse: **YENİ bir Project + 2 ProjectMember** oluşur
    (öğrenci + hoca). `createdProjectId` projeyi geriye bağlar.
  - `tagIds` — virgülle ayrılmış snapshot (proje oluşurken kullanılır).

### 4. Yayınlar
- **Publication** — Hocaların eklediği akademik yayın (`year`, `url`, `abstract`).
- **PublicationTag** — Yayın tag ilişkisi.

### 5. Ekip Kurma (Matching Wizard)
- **TeamIdea** — Matching wizard'ında doldurulan **planlama kaydı**. Asıl
  iş `Project` üzerinden döner, bu tablo "ben ne yapmak istemiştim?"
  hatırlatması için duruyor.
- **TeamInvite** — TeamIdea'ya bağlı davetler (history).
- **TeamIdeaTag** — TeamIdea tag ilişkisi.

> **Not**: Matching wizard tamamlandığında [features/matching.md](./features/matching.md) içinde anlatıldığı gibi,
> aynı transaction'da **hem TeamIdea hem gerçek Project + ProjectInvite'lar**
> oluşur. UI Project üzerinden çalışır.

### 6. Kayıtlı Eşleşmeler
- **SavedMatch** — Öğrencinin "sonra başvururum" diye kaydettiği hocalar.

### 7. Better Auth
- **Session**, **Account**, **Verification** — Better Auth'un yönettiği
  tablolar. Genelde manuel olarak query atılmaz.

## 🔗 İlişki Diyagramı (sadeleştirilmiş)

```
User ──┬── UserTag ──── Tag
       │
       ├── Project (owner)
       │     ├── ProjectTag ── Tag
       │     ├── ProjectMember ── User
       │     ├── Application ── User (applicant)
       │     └── ProjectInvite ── User (recipient + inviter)
       │
       ├── Publication ── PublicationTag ── Tag
       │
       ├── ProfessorApplication (student/professor)
       │     └── ↪ createdProjectId → Project
       │
       └── TeamIdea ── TeamInvite ── User
```

## 🚀 Migration & Seed

```bash
cd apps/api
pnpm prisma:generate     # Prisma Client'ı (src/generated/prisma'ya) üret
pnpm prisma:migrate      # Yeni migration uygula + dev DB'yi senkronize et
pnpm prisma:seed         # Demo veri yükle (prisma/seed.ts)
pnpm prisma:studio       # Görsel veritabanı yönetimi
```

`prisma/migrations/` altındaki migration'lar **kronolojik isimlendirme**
ile (`YYYYMMDDHHMMSS_<açıklama>`). En son uygulananlar:

| Migration | Ne ekledi? |
|-----------|------------|
| `20260514060000_add_team_formation` | TeamIdea + TeamInvite + TeamIdeaTag |
| `20260517172700_add_project_members` | ProjectMember + studentSlots/professorSlots |
| `20260517175838_add_project_invites_and_cascade` | ProjectInvite + cascade delete |
| `20260517182341_add_professor_applications` | ProfessorApplication |

> **Prisma Client çıktı yolu özelleştirilmiştir** — `src/generated/prisma`.
> `apps/api/src/lib/prisma.ts` bu yoldan import eder. Yeni bir API repo
> dışından (örn. tek seferlik script) Prisma çağrısı yapıyorsan **`--env-file=.env`**
> ile çalıştırman lazım (`DATABASE_URL` `.env`'de):
>
> ```bash
> cd apps/api && node --env-file=.env $(npm root)/tsx/dist/cli.mjs my-script.ts
> ```

## 🧪 Tutarlılık Kuralları (uygulamada zorlanan)

| Kural | Nerede uygulanıyor? |
|-------|---------------------|
| Owner aynı zamanda projenin ilk PROFESSOR üyesidir | `POST /api/projects` + acceptance flow |
| ProjectMember'a yeni satır eklenirken kontenjan kontrolü | `POST /api/projects/:id/invite` + `PUT /api/applications/:id` |
| Hoca olmayan kullanıcı proje oluşturamaz | `requireRole("PROFESSOR")` middleware |
| Bir kullanıcı bir projeye birden çok PENDING başvuru yapamaz | `Application.status` unique kontrol |
| Bir kullanıcı bir projeye birden çok PENDING davet alamaz | `ProjectInvite @@unique([projectId, userId])` |
| Owner kendi projesine başvuramaz | `POST /api/projects/:id/apply` kontrol |
| ACCEPTED başvurudan REJECTED'a dönüş → üyeliği siler | `PUT /api/applications/:id` transaction |

## 🔍 Doğrudan DB sorgu

`psql` kurulmadıysa Prisma Studio en kolayı:

```bash
cd apps/api && pnpm prisma:studio   # tarayıcıda :5555
```

Komut satırı isteyenler için:
```bash
brew install libpq && brew link --force libpq
psql "$DATABASE_URL"
```
