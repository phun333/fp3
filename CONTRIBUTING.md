# 🚀 FP3 — Projeyi Kendi Bilgisayarına Kurma Rehberi

Windows kullanıcıları için adım adım kurulum. Hiçbir şey bilmesen bile takip edebilirsin.

---

## 📋 Önce Bunları Kur

| Program | Link | Not |
|---------|------|-----|
| **Node.js v22+** | https://nodejs.org | "LTS" olanı indir, "Next Next Next" ile kur |
| **Git** | https://git-scm.com | Kurulumda hep Next de, default ayarlar yeterli |
| **VS Code** | https://code.visualstudio.com | Kod editörü |
| **Python 3.11+** | https://www.python.org | Kurulumda **"Add to PATH" kutusunu mutlaka işaretle** ✅ |

> 💡 Her birini kurduktan sonra bilgisayarı **yeniden başlat**.

---

## 1️⃣ Projeyi İndir

Masaüstüne veya istediğin bir klasöre aç, adres çubuğuna `cmd` yaz ve Enter'a bas.

```bash
git clone https://github.com/KULLANICI_ADI/fp3.git
cd fp3
```

---

## 2️⃣ Paketleri Yükle

```bash
npm install
```

> Bu adım biraz sürebilir (2-5 dk), sabırla bekle.

---

## 3️⃣ Ortam Değişkenlerini Ayarla (ENV Dosyaları)

Projeyi çalıştırmak için 3 tane `.env` dosyası oluşturman lazım. Bunlar gizli bilgileri tutar (şifreler, veritabanı adresleri vs.).

### 📄 `apps/api/.env`

```env
# PostgreSQL — Neon'dan ücretsiz al: https://neon.tech
DATABASE_URL=postgresql://KULLANICI:SIFRE@HOST/VERITABANI?sslmode=require

# Better Auth — rastgele uzun bir şifre yaz
BETTER_AUTH_SECRET=buraya-rastgele-uzun-bir-sifre-yaz-123456
BETTER_AUTH_URL=http://localhost:4000

# JWT — yine rastgele bir şifre
JWT_SECRET=baska-bir-rastgele-sifre-yaz-789

# CORS
CORS_ORIGINS=http://localhost:3000
```

### 📄 `apps/web/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 📄 `apps/ai-service/.env`

```env
DATABASE_URL=postgresql://KULLANICI:SIFRE@HOST/VERITABANI?sslmode=require
CORS_ORIGINS=http://localhost:3000,http://localhost:4000
```

> 🔑 **Neon veritabanı nasıl alınır:**
> 1. https://neon.tech adresine git, GitHub ile kayıt ol
> 2. "New Project" de, isim yaz, "Create" de
> 3. Connection string'i kopyala → `DATABASE_URL` yerine yapıştır

---

## 4️⃣ Veritabanını Hazırla

```bash
cd apps/api
npx prisma db push
```

Bu komut veritabanındaki tabloları oluşturur.

### Örnek veri ekle (opsiyonel ama önerilir):

```bash
npx tsx prisma/seed.ts
```

Sonra ana klasöre dön:

```bash
cd ../..
```

---

## 5️⃣ AI Servisini Kur (Opsiyonel)

AI tag önerisi istiyorsan:

```bash
cd apps/ai-service
pip install -r requirements.txt
```

> ⚠️ İlk çalıştırmada AI modeli indirecek (~90MB), internet lazım.

Ana klasöre dön:

```bash
cd ../..
```

---

## 6️⃣ Projeyi Çalıştır

### Hepsini birden başlat:

```bash
npm run dev
```

### Veya tek tek:

```bash
# Terminal 1 — API (Backend)
npm run dev:api

# Terminal 2 — Web (Frontend)
npm run dev:web

# Terminal 3 — AI Servisi (opsiyonel)
cd apps/ai-service
uvicorn main:app --reload --port 8000
```

---

## 7️⃣ Tarayıcıda Aç

| Servis | Adres |
|--------|-------|
| **Web App** | http://localhost:3000 |
| **API** | http://localhost:4000 |
| **API Docs (Swagger)** | http://localhost:4000/docs |
| **AI Servisi** | http://localhost:8000 (opsiyonel) |

---

## ✅ Her Şey Çalışıyor mu? Kontrol Et

1. http://localhost:4000/health → `{"status":"ok"}` dönmeli
2. http://localhost:3000 → Landing page açılmalı
3. Kayıt ol (email: `birsey@ostimteknik.edu.tr`, şifre: en az 8 karakter, 1 büyük harf, 1 rakam)

---

## 🔧 Sık Karşılaşılan Sorunlar

### ❌ `npm install` hata veriyor
```bash
# Node versiyonunu kontrol et (22+ olmalı)
node -v

# Cache temizle ve tekrar dene
npm cache clean --force
npm install
```

### ❌ `prisma db push` hata veriyor
- `.env` dosyasındaki `DATABASE_URL` doğru mu kontrol et
- Neon dashboard'dan connection string'i tekrar kopyala

### ❌ Port zaten kullanılıyor
```bash
# 3000 veya 4000 portunu kullanan programı bul ve kapat
netstat -ano | findstr :3000
taskkill /PID <PID_NUMARASI> /F
```

### ❌ `@ostimteknik.edu.tr` mailim yok
Geliştirme ortamında test için `apps/api/prisma/seed.ts`'deki hazır kullanıcıları kullanabilirsin.

### ❌ Python / pip bulunamıyor
Python kurulumunda **"Add to PATH"** seçeneğini işaretlemeyi unutmuş olabilirsin. Python'u kaldırıp tekrar kur, bu sefer PATH kutusunu işaretle.

---

## 📁 Proje Yapısı (Kısa Özet)

```
fp3/
├── apps/
│   ├── web/          → Frontend (Next.js) — localhost:3000
│   ├── api/          → Backend (Fastify) — localhost:4000
│   └── ai-service/   → AI Servisi (Python) — localhost:8000
├── packages/
│   ├── shared-types/ → Paylaşımlı TypeScript tipleri
│   ├── validation/   → Zod ile input doğrulama
│   └── config/       → TypeScript ayarları
└── package.json      → Ana proje dosyası
```

---

## 💻 Geliştirme İpuçları

- Kod değiştirince sayfa otomatik yenilenir (hot reload)
- API değişikliği yapınca API otomatik restart olur
- `npm run type-check` ile TypeScript hatalarını kontrol et
- Veritabanı şemasını değiştirirsen: `cd apps/api && npx prisma db push`

---

Sorun yaşarsan Discord/WhatsApp grubundan sor. İyi kodlamalar! 🎉
