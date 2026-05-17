# Davet Sistemi

Proje sahibinin bir kullanıcıyı projeye davet etmesi. **Üyelik dönüşümü
atomik** (transactional) yapılır.

## 🔁 Lifecycle

```
                ┌─────────────────────┐
   Owner ──────▶│  PENDING            │
   "Davet Et"   │  (ProjectInvite)    │
                └─────────┬───────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ACCEPTED          REJECTED         (silinmedi, durdu)
   + ProjectMember   (sadece status
   (transaction)      güncellenir)
```

## 📐 Schema

```prisma
model ProjectInvite {
  id           String              @id @default(cuid())
  projectId    String
  userId       String              // davet edilen
  inviterId    String              // gönderen (proje sahibi)
  invitedRole  UserRole            // STUDENT veya PROFESSOR
  status       ProjectInviteStatus @default(PENDING)
  message      String?

  project Project @relation(...)
  user    User    @relation("ProjectInviteRecipient", ...)
  inviter User    @relation("ProjectInviteSender", ...)

  @@unique([projectId, userId])    // aynı projeye aynı kullanıcı 1 kez
}
```

## 📤 Davet Gönderme

`POST /api/projects/:id/invite` — `routes/invitations.ts`. Sadece **owner**
çağırabilir.

```ts
body: {
  userId: string,
  message?: string,
}
```

### Kontroller
1. Proje var mı (404)
2. Çağıran owner mı (403)
3. Kendine davet değil mi (400)
4. Hedef kullanıcı var mı (404)
5. Zaten üye mi (409 "Bu kullanıcı zaten proje üyesi")
6. Kontenjan (`studentSlots`/`professorSlots` dolu mu) (400)
7. Mevcut davet durumu:
   - `PENDING` varsa → 409 "Zaten bekleyen davet var"
   - `ACCEPTED` varsa → 409 "Davet zaten kabul edilmiş"
   - `REJECTED` varsa → **yeniden PENDING'e çevrilir** (re-invite)

### `invitedRole`
Hedef kullanıcının kendi rolüne göre otomatik set edilir
(kullanıcı PROFESSOR ise davet PROFESSOR slot'a, STUDENT ise STUDENT slot'a).

## 📥 Daveti Yanıtlama

`PUT /api/invitations/:id` — recipient çağırır.

```ts
body: { status: "ACCEPTED" | "REJECTED" }
```

### REJECTED
Sadece `ProjectInvite.status = REJECTED`. Üyeliğe etki yok.

### ACCEPTED — kontenjan rekontrol + transaction

```ts
// 1. Tekrar kontenjan kontrol (yarış durumu için)
const currentCount = members.filter(m => m.role === invitedRole).length;
if (currentCount >= slots) → 400 "Kontenjan dolu"

// 2. Transaction
await prisma.$transaction(async (tx) => {
  await tx.projectInvite.update({ status: "ACCEPTED" });
  await tx.projectMember.upsert({
    where: { projectId_userId: { ... } },   // idempotent
    create: { projectId, userId, role: invitedRole },
    update: {},
  });
});
```

`upsert` sayesinde **race condition** veya yeniden çalıştırmada duplicate
oluşmaz.

## 🔍 Davet Listeleri

| Endpoint | Görünüm |
|----------|---------|
| `GET /api/invitations` | Bana gelen davetler (PENDING + history) |
| `GET /api/projects/:id/invitations` | Owner için: bu projedeki tüm davetler |
| `GET /api/projects/:id` (owner ise) | Detay yanıtında `invites` array'i da var |

## 🖥 UI'da Davet

### 1. Davet Gönderme — `InviteModal`

Dosya: `apps/web/src/components/invite-modal.tsx`.
İki yerden açılır:
- `/my-projects` kartında "Davet Et" butonu
- `/projects/[id]` detayında "Üye Davet Et" ve Ekip kartı header'ı

Davet modal özellikleri:
- **Arama**: isim/email/departman (`GET /api/users/search`)
- **Rol pills**: Tümü / Öğrenci / Akademisyen — yanında "1/3" kontenjan hint'i
- **Per-user durum**:
  - "Zaten üye" (gri rozet)
  - "Kontenjan dolu" (sarı rozet)
  - "Davet edildi" (yeşil rozet, modal kapanmadan birden fazla davet)
- **Mesaj alanı**: opsiyonel handoff note

### 2. Davetimi Görme — Gelen Kutusu

`/incoming-applications` → **Davetlerim** sub-inbox'ı.
Detay → [inbox.md](./inbox.md).

Her davet kartı:
- Davet eden (avatar + isim + departman)
- Status rozeti (PENDING / ACCEPTED / REJECTED)
- Davet edildiği rol ("Akademisyen olarak" / "Öğrenci olarak")
- Proje önizleme (başlık + tag'ler)
- Davet mesajı (varsa)
- Pending ise: **Kabul Et / Reddet** butonları

### 3. Owner Takibi — "Davet Ettiklerin" Kartı

`/projects/[id]` detayında, sadece owner'a görünür. Tüm davetler tek
listede (PENDING önce, sonra ACCEPTED, sonra REJECTED). Avatar + rol
ikonu + status rozeti.

### 4. My-Projects Kartı

`/my-projects` listesinde, bir projenin bekleyen daveti varsa:
```
👥 Hoca: 1/3  👥 Öğrenci: 0/15  📨 4 davet bekliyor
```

Backend `_count.invites: { where: { status: "PENDING" } }` ile sağlanır.

## 🧪 Test Senaryoları

| Senaryo | Beklenen |
|---------|----------|
| Hoca, projeyi davet ettiği kişiyi bir kez daha davet etmek isterse | 409 "Zaten bekleyen davet var" |
| Kontenjan dolu projede davet | 400 "Kontenjan dolu" |
| REJECTED bir davet → tekrar gönderme | Mevcut satır PENDING'e dönüşür |
| Davet eden kişi PROFESSOR'u STUDENT slot'a davet etmek istese | invitedRole hedef rolünden alınır, "Akademisyen" rolünde davet gider |
| Davet kabul edildiği an kontenjan dolduysa | 400 (yarış kontrolü) |
| Davet kabul → reddet | Üyelik silinir (ProjectMember.deleteMany) |

## 🔮 Geliştirme

- Davet mesajı düzenleme / silme (owner tarafından)
- Davet expiration (örn. 7 gün sonra otomatik REJECTED)
- Toplu davet (10 kişiyi tek seferde)
- Push notification — yeni davet gelince mobile bildirimi
