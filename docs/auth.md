# Kimlik Doğrulama (Auth)

[Better Auth](https://www.better-auth.com) ile session tabanlı auth. Web
cookie kullanır; mobile Bearer token plugin'i.

## 🔐 Aktif Stratejiler

| Strateji | Web | Mobile |
|----------|-----|--------|
| Email + Password (sign-up + sign-in) | ✅ | ✅ |
| Session cookie (HttpOnly, SameSite=Lax) | ✅ | — |
| Bearer token (`Authorization: Bearer <token>`) | — | ✅ |

OAuth providers, magic link vs. henüz aktif değil.

## 📧 Email Domain Kısıtı

Kayıt sırasında **sadece `@ostimteknik.edu.tr`** mailler kabul edilir.
Better Auth'un `signUp` hook'unda Zod ile validate ediliyor:

```ts
// apps/api/src/lib/auth.ts
email: z.string().email().refine(
  (e) => e.endsWith("@ostimteknik.edu.tr"),
  "Sadece Ostim Teknik Üniversitesi mail adresleri kabul edilir"
)
```

## 🌐 CORS & Trusted Origins

Lokal geliştirme için **dinamik** trusted origins:

```ts
trustedOrigins: (request?: Request) => {
  const env = (process.env.CORS_ORIGINS?.split(",") ?? []).map(s => s.trim());
  const reqOrigin = request?.headers.get("origin") ?? null;
  // LAN IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x) → izinli
  const lanPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|...)/;
  return [...env, ...(isLanOrigin ? [reqOrigin] : []), "exp://", "fp3://"];
}
```

Bu sayede:
- Web (`localhost:3000`) — env'den
- iPhone (`exp://192.168.1.X:8081`) — LAN pattern'den otomatik kabul
- Expo schemes — sabit listede

## 🍪 Web: Cookie Akışı

1. **Sign-in**: `POST /api/auth/sign-in/email` → Better Auth response'una
   `Set-Cookie: fp3.session_token=...; HttpOnly; SameSite=Lax`.
2. Sonraki istekler tarayıcı tarafından otomatik gönderilir.
3. Web client `fetch(... credentials: "include")` ile cookie'yi iletir.
4. Next.js dev mode'da **rewrite yok** — Next.js doğrudan `:3001`'e fetch
   eder. CORS sayesinde cookie çalışır.

**Cookie prefix**: `fp3.*` — Better Auth config'inde `cookiePrefix`.

## 📱 Mobile: Bearer Akışı

Better Auth'un [Bearer plugin](https://www.better-auth.com/docs/plugins/bearer)'i
aktif:

```ts
// apps/api/src/lib/auth.ts
plugins: [bearer()],
```

Akış:
1. Native client `POST /api/auth/sign-in/email` ile giriş yapar.
2. Cookie yerine response header'da **bearer token** döner.
3. Mobile uygulaması bu token'ı `SecureStore`'a yazar
   (`apps/mobile/src/lib/auth-context.tsx`).
4. Sonraki tüm fetch'lere `Authorization: Bearer <token>` ekler.

### iOS Cookie Sorunu

iOS `NSURLSession`'ı bazen birden fazla Set-Cookie'yi virgülle birleştirip
geri gönderir (`a=1, b=2` yerine `a=1; b=2` beklenir). Bu Better Auth'u
şaşırtır. **Çözüm** (`apps/api/src/server.ts` → `onRequest` hook):

```ts
app.addHook("onRequest", async (req) => {
  const auth = req.headers["authorization"];
  if (auth?.toLowerCase().startsWith("bearer ")) {
    // Bearer geldiyse Cookie'yi tamamen yok say
    delete req.headers.cookie;
  } else if (req.headers.cookie?.includes(",")) {
    // Bearer yoksa, virgüllü cookie'yi `; ` ile normalize et
    req.headers.cookie = req.headers.cookie.replace(/,(?=\s*[A-Za-z0-9_.-]+=)/g, "; ");
  }
});
```

## 🪝 Frontend Auth Context

### Web: `apps/web/src/lib/auth-context.tsx`

```tsx
<AuthProvider>           // _layout veya dashboard layout
  <App />
</AuthProvider>

// Kullanım
const { user, signOut, loading } = useAuth();
```

Özellikler:
- **localStorage persist**: User bilgisi `fp3.user` key'i altında cache'lenir.
  İlk açılışta UI logout görünmesini engeller (`/api/auth/get-session` yanıtı
  beklenirken).
- **Ağ hatasına dayanıklı**: API dev restart sırasında session refresh
  başarısız olursa cache'deki user korunur. Sadece API açıkça "user yok"
  derse logout olur.

### Mobile: `apps/mobile/src/lib/auth-context.tsx`

Web ile aynı API, farklı backend:
- `expo-secure-store` ile token saklama
- Her API çağrısında `Authorization: Bearer ...` header'ı ekleme

## 🛡 Middleware (API)

```ts
// apps/api/src/middleware/auth.ts

requireAuth        // → 401 if no session
requireRole("PROFESSOR")  // → 403 if not a professor
requireRole("STUDENT")    // → 403 if not a student

getSession(request)       // optional - returns null if no session
```

`getSession` opsiyonel kontrol için kullanışlı, örn. `/api/projects/:id`
detayında "Davet listesi sadece owner'a görünsün":

```ts
const session = await getSession(request);
const isOwner = session?.user?.id === project.ownerId;
if (!isOwner) delete projectOut.invites;
```

## 🔧 Geliştirme

### Yeni kullanıcı (CLI'dan)

`apps/api/prisma/seed.ts` demo kullanıcıları oluşturur. Tek seferlik
yaratma:

```bash
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@ostimteknik.edu.tr",
    "password":"Sifre123!",
    "name":"Test User",
    "role":"STUDENT",
    "department":"Bilgisayar Mühendisliği"
  }'
```

### Session debug

```bash
curl -b "fp3.session_token=..." http://localhost:3001/api/auth/get-session
```

veya Bearer:

```bash
curl -H "Authorization: Bearer ..." http://localhost:3001/api/auth/get-session
```

## ⚠️ Yaygın Hatalar

| Belirti | Sebep | Çözüm |
|---------|-------|-------|
| `401 Oturum açmanız gerekiyor` | Cookie iletilmiyor | `credentials: "include"` ve CORS origin doğru mu? |
| Web'de F5 sonrası flicker | Session refresh sırasında user `null` | ✅ Zaten çözüldü: `loadCachedUser()` |
| Mobile'da 401 | Bearer header eksik | `apps/mobile/src/lib/api.ts` interceptor'ı kontrol et |
| iOS'ta random 401 | Cookie comma-merge | ✅ `onRequest` hook çözüyor |
| Sign-up "Email kabul edilmiyor" | Domain `@ostimteknik.edu.tr` değil | Test için seed user kullan veya schema'yı dev'de gevşet |
