# Birleşik Gelen Kutusu

`/incoming-applications` rotası, eskiden 3 ayrı sayfada dağınık olan tüm
gelen istekleri tek bir **sol-rail + içerik paneli** layout'unda
birleştirir.

## 🎯 Niye birleştirildi?

Daha önce:
- `/incoming-applications` — projeme gelen başvurular (hoca)
- `/professor-applications` — bana proje öneren öğrenciler (hoca)
- `/invitations` — bana gelen davetler (herkes)

Bu 3 sayfa da menüde ayrı görünüyordu ve "buraya mı baksam, oraya mı?"
karmaşası yaratıyordu. Şimdi **tek bir Gelen Kutusu** + sol rail + sub-inbox.

## 🏗 Layout

```
┌──────────────────────────────────────────────────────┐
│  📥 Gelen Kutusu                  [⚠ 3 cevap bekliyor]│
├──────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────────────────────┐   │
│ │ 📥 Proje     │  │  ▼ Aktif sub-inbox içeriği   │   │
│ │    Başvuruları[3] │  - Status filter tab'ları  │   │
│ │ 📋 Öğrenci   │  │  - Kart listesi              │   │
│ │    Talepleri │  │  - Empty state               │   │
│ │ ✉️ Davetlerim│  │                              │   │
│ └──────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

Dosya: `apps/web/src/app/(dashboard)/incoming-applications/page.tsx`.

## 👥 Rol Bazlı Görünüm

| Sub-inbox | Hoca | Öğrenci |
|-----------|------|---------|
| **Proje Başvuruları** (`applications`) — kendi projelerine yapılan başvurular | ✅ | — |
| **Öğrenci Talepleri** (`requests`) — doğrudan kendisine gelen proje önerileri | ✅ | — |
| **Davetlerim** (`invitations`) — başkasının davet ettiği projeler | ✅ | ✅ |

Öğrenciler tek sub-inbox'lı bir sayfa görür (Davetlerim). Hocalar 3'lü
sol rail.

## 🔌 Veri Kaynakları

Her sub-inbox kendi API'sini çağırır, ayrı TanStack Query key'leri:

| Sub-inbox | Endpoint | Query key |
|-----------|----------|-----------|
| Proje Başvuruları | `GET /api/applications/incoming` | `["incoming-applications-all"]` |
| Öğrenci Talepleri | `GET /api/professor-applications/incoming` | `["professor-applications-incoming"]` |
| Davetlerim | `GET /api/invitations` | `["invitations"]` |

Her panel kendi mutation'larını yönetir (`useStatusFilter` ortak hook'u
ile status filter tutar).

## 🎨 Status Görselleştirme

| Status | Renk | İkon | Border |
|--------|------|------|--------|
| `PENDING` | amber | `Clock` | sol border amber |
| `ACCEPTED` | emerald | `Check` | sol border emerald |
| `REJECTED` | rose | `X` | sol border rose |

Sol border (4px) sayesinde kart listesinde durum hemen göze çarpar.

## 🧮 Bekleyen Sayacı

Üst header sağ tarafta toplam bekleyenler:
```
🌟 5 cevap bekliyor
```

Sol rail'de her sub-inbox satırının yanında da kendi bekleyen sayısı
amber rozet olarak (rozet > 0 ise). Bu sayede:
- Kullanıcı her açılışta hangi bölümün acil olduğunu görür
- Cevaplanmış başvurular gri rozet olur, dikkat çekmez

## 🔄 Eski Rotalar — Redirect

```ts
// apps/web/src/app/(dashboard)/invitations/page.tsx
import { redirect } from "next/navigation";
export default function() { redirect("/incoming-applications"); }
```

`/invitations` ve `/professor-applications` doğrudan
`/incoming-applications`'a yönlenir. Eski yer imleri kırılmaz.

## ⚡ Aksiyonlar

Her panel kart üstünde 1-tıkla aksiyon:

| Panel | Pending Aksiyonu | Resolved Görünüm |
|-------|------------------|------------------|
| Proje Başvuruları | "Kabul Et" / "Reddet" | Status rozeti + projeye bağlantı |
| Öğrenci Talepleri | "Kabul Et & Proje Aç" / "Reddet" | "Oluşturulan projeyi aç →" |
| Davetlerim | "Kabul Et" / "Reddet" | Status rozeti |

Mutation success → ilgili query'ler invalidate (cross-panel etki):

```ts
// Örn: "Öğrenci Talepleri" kabul edilince
qc.invalidateQueries({ queryKey: ["professor-applications-incoming"] });
qc.invalidateQueries({ queryKey: ["my-projects"] });  // yeni proje çıktı
```

## 🛠 Geliştirme Notları

### Yeni bir sub-inbox eklemek

Diyelim "Etiket Önerileri" diye bir sub-inbox eklemek istiyorsun:

1. `items` dizisine yeni bir entry ekle (key, label, icon, visible).
2. Veri için bir `useQuery` çağrısı ekle.
3. Bir `XPanel` component'i yaz (Applications/Requests/Invitations
   panellerini örnek al).
4. Render switch'ine ekle: `{active === "xkey" && <XPanel ... />}`.

`useStatusFilter` hook'u status filter tab'larını yeniden kullanır.

### Boş durum tasarımı

`EmptyState` component'i her panelde aynı: ikon + başlık + açıklama +
opsiyonel aksiyon butonu. Filter aktifken farklı mesaj göster.

## 🔮 Yapılabilecekler

- WebSocket / SSE ile push update (yeni başvuru gelince badge anında dolar)
- Bulk actions (10 başvuruyu birden onayla)
- Filtre ek opsiyonları: tarih aralığı, tag bazlı
- Bildirim merkezine "yeni öğeler" badge'ini header'a da yansıt
