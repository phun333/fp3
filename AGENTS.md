# FP3 — Finding Publication Project Partner

## Proje Hakkında
Üniversite öğrencileri ve akademisyenler arasında makale/proje ortaklığı kurmayı sağlayan, tag tabanlı akıllı eşleştirme platformu.
- **Üniversite:** Ostim Teknik Üniversitesi
- **Mail Domain:** @ostimteknik.edu.tr

## Tech Stack
- **Monorepo:** Turborepo (pnpm workspaces)
- **Web:** Next.js 16 (App Router, TypeScript, Tailwind CSS v4, shadcn/ui)
- **API:** Fastify (TypeScript)
- **AI Service:** Python FastAPI + KeyBERT + sentence-transformers
- **Mobile:** Expo (React Native, TypeScript, NativeWind)
- **ORM:** Prisma + PostgreSQL (Neon)
- **Auth:** Better Auth
- **Paylaşımlı Paketler:** @fp3/shared-types, @fp3/validation, @fp3/config

## Proje Yapısı
```
fp3/
├── apps/
│   ├── web/          → Next.js 16 (App Router)
│   ├── api/          → Fastify
│   ├── ai-service/   → Python FastAPI
│   └── mobile/       → Expo
├── packages/
│   ├── shared-types/ → TypeScript tipleri
│   ├── config/       → TSConfig'ler
│   └── validation/   → Zod şemaları
├── tasks/            → Faz bazlı görev dosyaları
└── fp3-project-plan.md → Tam proje planı
```

## Kodlama Kuralları
- **Dil:** TypeScript strict mode (tüm JS projelerde)
- **UI:** shadcn/ui + Phosphor Icons (@phosphor-icons/react)
- **Tema:** globals.css'te merkezi tema değişkenleri, indigo (#6366f1) primary renk
- **Validation:** Tüm API input'ları packages/validation'daki Zod şemalarıyla doğrulanır
- **API Response:** `{ success: boolean, data?: T, error?: string }` formatı
- **Pagination:** `{ data: T[], meta: { page, limit, total, totalPages } }` formatı
- **Import:** Paylaşımlı paketlerden import: `import { User } from "@fp3/shared-types"`
- **Türkçe:** UI metinleri ve hata mesajları Türkçe, kod/değişken isimleri İngilizce
- **Dosya isimlendirme:** kebab-case (bileşenler), camelCase (fonksiyonlar)

## Görev Takibi
Görevler `tasks/FAZ-*.md` dosyalarında tanımlı. Her faz tamamlandığında checkbox'lar işaretlenir.

## Önemli Komutlar
```bash
npm run dev          # Tüm servisleri başlat
npm run dev:web      # Sadece web
npm run dev:api      # Sadece API
npm run build        # Tüm projeleri build et
npm run type-check   # TypeScript kontrol
```

## Dikkat Edilecekler
- Next.js versiyonu: 16.1.6 (sabit, değiştirme)
- Sadece @ostimteknik.edu.tr email'leri kabul edilir
- AI servisi ücretsiz model kullanır: all-MiniLM-L6-v2
- Neon PostgreSQL ücretsiz tier kullanılır
- Her değişiklikten sonra type-check yapılmalı
