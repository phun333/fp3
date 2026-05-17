# Mobile Uygulaması

Expo SDK 54 + Expo Router + React Native 0.81. Web ile aynı backend'i
kullanır; auth ve şebeke katmanı native'e özel.

## 📁 Yapı

```
apps/mobile/
├── app/                          → Expo Router (file-based routing)
│   ├── _layout.tsx               → Root layout: AuthProvider + theme
│   ├── (auth)/                   → giriş yapmamış kullanıcılar
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (app)/                    → oturum açmış kullanıcılar
│       ├── _layout.tsx           → tab/stack nav
│       ├── index.tsx             → ana sayfa
│       ├── discover.tsx
│       ├── matching.tsx
│       ├── projects/
│       │   ├── index.tsx         → liste
│       │   └── [id].tsx          → detay
│       ├── professors/
│       ├── publications/
│       ├── my-projects.tsx
│       ├── my-applications.tsx
│       ├── my-professor-applications.tsx
│       ├── incoming-applications.tsx
│       ├── invitations.tsx       → → incoming-applications redirect
│       ├── professor-applications.tsx
│       ├── saved-matches.tsx
│       └── profile.tsx
└── src/
    ├── components/               → paylaşımlı UI parçaları
    └── lib/
        ├── api.ts                → fetch + cookie + bearer
        ├── auth-context.tsx      → AuthProvider + useAuth
        ├── query-client.ts       → TanStack Query
        ├── theme.ts              → renk/spacing token'ları
        └── utils.ts
```

## 🌐 API Bağlantısı

Mobile cihaz `localhost:3001`'e erişemez (kendi localhost'unu görür). 3
seviyeli **dinamik host çözümleme**:

```ts
// apps/mobile/src/lib/api.ts → resolveApiUrl()

1) process.env.EXPO_PUBLIC_API_URL    // .env'de manuel
2) Constants.expoConfig.hostUri       // Metro'nun verdiği LAN IP
3) "http://localhost:3001"            // simülatör fallback
```

`.env.example`:
```env
# Gerekirse manuel override
EXPO_PUBLIC_API_URL=http://192.168.1.34:3001
```

API tarafında Better Auth'un `trustedOrigins` callback'i bu LAN IP'lerini
otomatik kabul eder ([auth.md](./auth.md)).

## 🔐 Auth: Hibrit Cookie + Bearer

iOS NSURLSession Set-Cookie'leri bozuk handle ettiği için **Bearer**
plugin'i kullanıyoruz, ama eski uyumluluk için cookie'ler de paralel
saklanıyor.

### Saklama
- **Bearer token** → `SecureStore["fp3.bearer"]`
- **Cookie cache** → `SecureStore["fp3.cookies"]` (yedek)

### Akış
1. `signIn` → response header'ından Bearer token okunur
2. Sonraki tüm fetch'lere `Authorization: Bearer <token>` eklenir
3. Server'ın `onRequest` hook'u Bearer geldiğinde Cookie header'ını siler
   (iOS sorununu nötralize eder)

### `auth-context.tsx`
Web ile aynı API:
```tsx
const { user, signIn, signOut, loading } = useAuth();
```
- `loadCachedUser()` ile SecureStore'dan user/token hidrate edilir
- `refreshSession()` → `/api/auth/get-session`
- Ağ hatasına dayanıklı (offline durumda cache korunur)

## 🎨 UI Yaklaşımı

- React Native primitives (`View`, `Text`, `Pressable`)
- `react-native-safe-area-context` — notch/dynamic island
- Theme/token'lar `src/lib/theme.ts`'te (web ile aynı palet)
- Phosphor Icons'ın native versiyonu yok → ikonlar **inline SVG** veya
  `react-native-svg` (paket eklenebilir)

## 🚀 Çalıştırma

```bash
pnpm dev:mobile           # Expo Metro (:8081 + LAN)
# veya
cd apps/mobile && pnpm dev
```

Telefonda Expo Go açıp QR kod oku. Aynı Wi-Fi'da olmalısın.

**Önemli**: API server'ın da çalışıyor olması gerek (`pnpm dev:api`).
Telefonun firewall'una takılırsa `EXPO_PUBLIC_API_URL=http://<bilgisayar-ip>:3001`
ayarla.

## 📦 Önemli Bağımlılıklar

- `expo` 54, `expo-router` 6 (file-based routing)
- `expo-secure-store` 15 (token saklama)
- `expo-linking` 8 (deep link, auth callback'leri)
- `react-native-safe-area-context` + `react-native-screens`

## 🔧 Geliştirme İpuçları

### Aynı IP değişince
Wi-Fi değişince IP değişir → cached `EXPO_PUBLIC_API_URL` artık geçersiz.
Çözümler:
1. `.env`'i güncelle
2. veya env'i sil → Metro hostUri'sini otomatik kullanır
3. Uygulamayı temizle: `pnpm dev:mobile --clear`

### iOS Cookie problemini debugging
Server log'larında `, ` ile birleştirilmiş cookie görürsen `onRequest`
hook'una bakman gerekebilir. Web çalışıp mobile takılıyorsa muhtemelen
bu sorun.

### Tip eşleştirmesi
Web ile aynı `@fp3/shared-types` ve `@fp3/validation` paketleri kullanılır.
Backend tarafında bir tip değiştiyse `pnpm type-check` ile her iki app'i
de doğrula.

## 🚧 Eksik / TODO

- Push notification (davet/başvuru bildirimleri için ideal)
- Offline-first cache (TanStack Query persist)
- Biometric unlock (`expo-local-authentication`)
- App store build pipeline
