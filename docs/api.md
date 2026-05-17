# API Referansı

Fastify 5 ile yazılmış, `:3001` portunda çalışır. Tüm rotalar
`apps/api/src/routes/` altında, route dosyaları `apps/api/src/server.ts`
içinde `app.register(...)` ile bağlanır.

**Tüm cevaplar:**
```ts
{ success: true,  data: ... }                  // başarılı
{ success: false, error: "..." }               // hata
// pagination'lı:
{ success: true,  data: [...], meta: { page, limit, total, totalPages } }
```

**Auth:**
- Çoğu rota `requireAuth` middleware'i kullanır → 401 döner oturum yoksa.
- Bazı rotalar `requireRole("PROFESSOR")` veya `requireRole("STUDENT")` ile
  rol bazlı korumalı.

OpenAPI/Swagger UI: `http://localhost:3001/docs` (Scalar).

---

## Auth — `routes/auth.ts` (+ Better Auth)

| Endpoint | Açıklama |
|----------|----------|
| `POST /api/auth/sign-up/email` | Email + parola ile kayıt. **`@ostimteknik.edu.tr`** domain'i zorunlu. |
| `POST /api/auth/sign-in/email` | Giriş. Cookie veya Bearer token döner. |
| `POST /api/auth/sign-out` | Oturumu kapat. |
| `GET  /api/auth/get-session` | Mevcut session ve user bilgisi. |

Detaylı akış → [auth.md](./auth.md).

---

## Profil — `routes/profile.ts`

| Endpoint | Açıklama |
|----------|----------|
| `GET  /api/profile` | Kendi profilim (tag'leriyle birlikte). |
| `PUT  /api/profile` | Profil güncelle (name, bio, department, year, avatarUrl). |
| `PUT  /api/profile/tags` | Tag listesini değiştir. |
| `GET  /api/profile/:id` | Başka bir kullanıcının profili. |

---

## Projeler — `routes/projects.ts`

| Endpoint | Auth | Açıklama |
|----------|------|----------|
| `GET  /api/projects` | public | Filtre/arama/pagination ile liste. |
| `GET  /api/projects/:id` | public | Proje detayı. **Davet listesi sadece owner'a döner**. |
| `POST /api/projects` | `PROFESSOR` | Yeni proje (owner otomatik üye olur). |
| `PUT  /api/projects/:id` | owner | Proje güncelle (title, description, status, slot'lar, tag'ler). |
| `DELETE /api/projects/:id` | owner | Proje sil (cascade). |
| `GET  /api/my-projects` | auth | Sahibi olduğum + üyesi olduğum projeler. |

**Önemli notlar:**
- `studentSlots: 0–50`, `professorSlots: 1–20` (validation'da).
- Hoca kendi projesine başvuramaz; üye olduğu projeye yeniden davet edilemez.
- Owner herhangi bir zaman slot sayısını **mevcut üye sayısının altına**
  düşüremez.

---

## Başvurular — `routes/applications.ts`

| Endpoint | Auth | Açıklama |
|----------|------|----------|
| `POST /api/projects/:id/apply` | auth | Açık projeye başvur (öğrenci veya hoca). |
| `GET  /api/projects/:id/applications` | owner | Projenin tüm başvuruları. |
| `PUT  /api/applications/:id` | owner | `status: ACCEPTED \| REJECTED`. **Kabul → ProjectMember satırı** transaction'da oluşur. |
| `GET  /api/my-applications` | auth | Benim gönderdiğim başvurular. |
| `GET  /api/applications/incoming` | `PROFESSOR` | **Sahibi olduğum projelere gelen başvurular**, status filtreli + counts. |

---

## Davetler — `routes/invitations.ts`

| Endpoint | Auth | Açıklama |
|----------|------|----------|
| `POST /api/projects/:id/invite` | owner | Bir kullanıcıyı projeye davet et (kontenjan + duplicate check). |
| `GET  /api/invitations` | auth | Bana gelen tüm davetler (PENDING/ACCEPTED/REJECTED). |
| `PUT  /api/invitations/:id` | recipient | Daveti kabul/reddet. Kabul → ProjectMember + transaction. |
| `GET  /api/projects/:id/invitations` | owner | **Bu projede gönderdiğim** davetlerin durumu. |
| `GET  /api/users/search` | auth | İsim/email/departman ile kullanıcı arama (davet hedefi seçimi için). |

---

## Hoca Başvuruları — `routes/professor-applications.ts`

Öğrencinin doğrudan bir hocaya yaptığı **proje önerisi** akışı.

| Endpoint | Auth | Açıklama |
|----------|------|----------|
| `POST /api/professor-applications` | `STUDENT` | Hocaya proje teklifi gönder (title, description, tagIds, message). |
| `GET  /api/professor-applications/incoming` | `PROFESSOR` | Bana gelen öğrenci talepleri. |
| `GET  /api/professor-applications/mine` | `STUDENT` | Gönderdiğim talepler. |
| `PUT  /api/professor-applications/:id` | `PROFESSOR` | Kabul/reddet. **Kabul → yeni Project + 2 ProjectMember** (öğrenci + hoca) transaction'da oluşur. |

---

## Tag'ler — `routes/tags.ts`

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/tags` | Tüm tag'ler (kategori bazlı gruplu). |
| `GET /api/tags/:id` | Tek tag detayı. |

---

## Akademisyenler & Öğrenciler

| Endpoint | Dosya | Açıklama |
|----------|-------|----------|
| `GET /api/professors` | `professors.ts` | Filtre+pagination'lı hoca listesi. |
| `GET /api/professors/:id` | `professors.ts` | Hoca detayı + yayınlar + projeler. |
| `GET /api/students` | `students.ts` | Öğrenci listesi. |
| `GET /api/students/:id` | `students.ts` | Öğrenci detayı. |

---

## Keşif & Eşleştirme — `routes/discover.ts`, `routes/matching.ts`, `routes/team-ideas.ts`

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/discover/professors` | Öneri: kendi tag'lerime göre hocalar (skor sıralı). |
| `GET /api/discover/projects` | Öneri: projeler. |
| `GET /api/discover/students` | Öneri: öğrenciler. |
| `POST /api/match/professors` | Öğrenci için: amaç (MAKALE/PROJE) + tag → en uygun hocalar. |
| `POST /api/match/team` | **Hoca için ekip eşleştirme**: fikir + slot + tag → seçili+önerilen hocalar + önerilen öğrenciler. |
| `POST /api/team-ideas` | Wizard tamamlandı → **TeamIdea + gerçek Project + ProjectInvite'lar** atomik oluşturur. |
| `GET  /api/team-ideas/my` | Oluşturduğum / davet edildiğim ekip fikirleri. |

Akış detayları: [features/matching.md](./features/matching.md).

---

## Yayınlar — `routes/publications.ts`

| Endpoint | Auth | Açıklama |
|----------|------|----------|
| `GET    /api/publications` | public | Liste + pagination. |
| `GET    /api/publications/:id` | public | Detay. |
| `POST   /api/publications` | `PROFESSOR` | Yeni yayın. |
| `PUT    /api/publications/:id` | owner | Güncelle. |
| `DELETE /api/publications/:id` | owner | Sil. |

---

## Kayıtlı Eşleşmeler — `routes/saved-matches.ts`

| Endpoint | Auth | Açıklama |
|----------|------|----------|
| `POST   /api/saved-matches` | auth | Bir hocayı kaydet. |
| `DELETE /api/saved-matches` | auth | Kayıttan çıkar. |
| `GET    /api/saved-matches` | auth | Kayıtlarım. |
| `GET    /api/saved-matches/ids` | auth | Sadece id seti (UI'da heart-icon için). |

---

## AI — `routes/ai.ts` (Python AI'a proxy)

| Endpoint | Auth | Açıklama |
|----------|------|----------|
| `POST /api/ai/suggest-tags` | auth | Metinden tag öner (`→ /api/ai/extract-tags`). |
| `POST /api/ai/analyze-profile` | auth | Bio + yayın özeti → tag + araştırma alanı. |
| `GET  /api/ai/health` | public | AI servisinin durumu. |
| `POST /api/ai/reload-tags` | auth | AI servisindeki tag cache'i yenile. |

> Tüm AI endpoint'leri **proxy**'dir; gerçek hesap `apps/ai-service/main.py`.
> Detay → [ai-service.md](./ai-service.md).

---

## ⚙️ Endpoint Geliştirme Notları

### Response schema kullanmayın (nested veriler için)

`fast-json-stringify` strict şemada tanımlı olmayan alanları **sessizce
siler**. `Project` ↔ `Application` arasında circular ref var; nested
`members`, `applications`, `_count` alanlarını döndürmek için **response
şeması olmayan** rotalar tercih edildi.

Etkilenen rotalar (response şeması kaldırıldı):
- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/my-projects`
- `GET /api/discover/projects`

Yeni nested GET rotası eklerken aynı yaklaşımı kullan.

### Boş body koruması

`apps/api/src/server.ts` custom JSON parser'ı boş body için `undefined`
döner — DELETE / parametresiz POST'lar 500 atmamalı.

### Better Auth: Bearer vs Cookie

iOS native istemcileri Set-Cookie'leri bozuk join edebiliyor. Bunun için
server.ts'te `onRequest` hook'u:
- Authorization: Bearer geliyorsa Cookie header'ı silinir.
- Yoksa, virgülle bağlı çoklu cookie `; ` olarak normalize edilir.
