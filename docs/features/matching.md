# Matching & Ekip Kurma

İki ayrı eşleştirme akışı var: **öğrenci → hoca** ve **hoca → ekip**.

## 1. Öğrenci → Hoca (`/matching` — öğrenci görünümü)

**Component**: `MatchingWizard` (`apps/web/src/app/(dashboard)/matching/page.tsx`)

```
1. Amaç         → "MAKALE" veya "PROJE" seç
2. Detay        → açıklama
3. İlgi alanları → tag seçim
4. Özet         → onay ekranı
5. Sonuçlar     → eşleşen hocalar (skor sıralı)
                  her hocada:
                  - "Kaydet" (SavedMatch)
                  - "Hocaya Başvur" → ProfessorApplication
```

### Skorlama (backend)
`POST /api/match/professors` → `routes/matching.ts`. Skor:
- Tag eşleşme: `commonTags / max(targetTags, profTags)`  (×0.7)
- Aktivite: `(projects + publications) * 15` clamp 100 (×0.2)
- Departman: aynı departman 100, başka 40 (×0.1)

### "Hocaya Başvur" akışı
- Form: title + description + tags + opsiyonel mesaj
- `POST /api/professor-applications` → DB'ye `ProfessorApplication` (status `PENDING`)
- Hoca `/incoming-applications → Öğrenci Talepleri`'nde görür
- Kabul ederse → **yeni Project + 2 ProjectMember** atomik oluşur
- Öğrenci `/my-professor-applications`'da `createdProjectId` üzerinden
  projeye gidebilir

## 2. Hoca → Ekip (`/matching` — hoca görünümü)

**Component**: `ProfessorTeamWizard` (`apps/web/src/components/professor-team-wizard.tsx`)

5 adımlık wizard. **Ana çıktı: gerçek bir Project + birden fazla ProjectInvite**.

```
1. Fikir
   - title (≥5 char)
   - description (≥20 char)

2. Kontenjan
   - professorSlots (1-20, hoca dahil)
   - studentSlots (1-50)

3. Alan
   - tag seçim (profilden auto-fill, AI önerisi var)

4. Hoca
   - önerilen hocalar listesi
   - max (professorSlots - 1) seçim
   - her seçiliye opsiyonel "handoff note"

5. Ekip (results)
   - önerilen öğrenciler listesi
   - max studentSlots seçim
   - "Ekip fikrini kaydet ve davetleri oluştur" →
     POST /api/team-ideas
```

### Backend: `POST /api/team-ideas`

`routes/team-ideas.ts`. Tek transaction'da iki şey üretir:

1. **TeamIdea** — planlama kaydı (her zaman owner için bir "history")
2. **Project** — gerçek operasyonel proje
   - Owner otomatik `PROFESSOR` member
   - Tag'ler kopyalanır
   - Her seçili davetli için bir **ProjectInvite** (status: `PENDING`)
     - Hocalar için `invitedRole: PROFESSOR`
     - Öğrenciler için `invitedRole: STUDENT`
   - Handoff note → `ProjectInvite.message`

Response:
```json
{
  "success": true,
  "data": {
    "id": "...",            // TeamIdea id
    "projectId": "...",     // gerçek Project id
    "project": { ... }      // tam proje payload'u
  }
}
```

### UI Sonrası

Wizard tamamlanınca yeşil başarı kartı:
```
✅ Proje oluşturuldu ve davetler gönderildi.
   → [Projeyi Aç]   [Projelerim]
```

- **Projeyi Aç** → `/projects/<projectId>` (Ekip kartı + Davet Ettiklerin
  kartı görünür)
- Davet edilenler kendi `/incoming-applications → Davetlerim`'de görürler
- Hoca, proje detayında her davetlinin **PENDING/ACCEPTED/REJECTED**
  durumunu takip eder

### Skorlama (team match)

`POST /api/match/team` → 3 paralel sorgu:
- Seçili hocalar (varsa)
- Önerilen hocalar (tag ortak olan)
- Önerilen öğrenciler (tag ortak olan)

Aynı skor formülü kullanılır (tag/activity/department weighted). Sonuçlar
her grup için ayrı `top_n` ile döner.

## 🎨 AI Entegrasyonu

Tag seçim adımlarında **`AiTagSuggestions`** component'i:
- Wizard'da: `title + description` üzerinden öneri
- Öğrenci başvurusunda: form description üzerinden
- Tıklanan tag → mevcut listeye eklenir (max 10)

Detay → [../ai-service.md](../ai-service.md).

## 🧪 Test Akışı

1. Hoca olarak `/matching` → wizard'ı tamamla → 1 hoca + 3 öğrenci davet et
2. "Projeyi Aç" → Ekip kartında sahip görünür, "Davet Ettiklerin"'de 4 satır PENDING
3. `/my-projects` → kartta "📩 4 davet bekliyor" rozeti
4. Öğrencilerden biri olarak gir → `/incoming-applications → Davetlerim` → 1 satır görür
5. "Kabul Et" → projede `ProjectMember` olur, hoca tarafında durum ACCEPTED'a döner
