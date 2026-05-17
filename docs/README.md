# FP3 Dokümantasyonu

> **FP3** — Üniversite öğrencileri ve akademisyenler arasında akıllı eşleştirmeyle
> proje/yayın ortaklığı kuran tag tabanlı platform. *Ostim Teknik Üniversitesi*
> (`@ostimteknik.edu.tr`) için tasarlandı.

Bu klasör projenin **mimarisini, akışlarını ve her bileşenin nerede nasıl
kullanıldığını** detaylı şekilde açıklar. Hangi belgeyi hangi soruyu cevaplamak
için açacağını aşağıdaki tablodan bulabilirsin.

## 📚 İçindekiler

| Belge | Ne anlatır? |
|-------|-------------|
| [architecture.md](./architecture.md) | Sistemin **kuş bakışı** mimarisi: hangi servis hangi portta, veri akışı nasıl gidiyor, monorepo yapısı |
| [database.md](./database.md) | Postgres şeması, ana tablolar, ilişki diyagramı, migration politikası |
| [api.md](./api.md) | Fastify API'sinin **tüm endpoint'lerinin** referansı; auth, davet, başvuru, matching, vb. |
| [ai-service.md](./ai-service.md) | Python AI servisi — KeyBERT + sentence-transformers ile tag önerisi; UI'da **nerede ve nasıl** kullanılıyor |
| [auth.md](./auth.md) | Better Auth oturumu, session cookie, mobile Bearer token, e-posta domain filtresi |
| [web-app.md](./web-app.md) | Next.js dashboard'unun yapısı, sayfalar, paylaşımlı component'ler ve state management |
| [mobile-app.md](./mobile-app.md) | Expo React Native uygulaması, route grupları, native-spesifik auth detayları |
| [features/inbox.md](./features/inbox.md) | **Gelen Kutusu** — birleşik başvuru/davet/talep ekranının iç tasarımı |
| [features/matching.md](./features/matching.md) | Matching wizard → Project + ProjectInvite üretim akışı; hocanın ekip kurma yolculuğu |
| [features/invitations.md](./features/invitations.md) | Davet sistemi: gönderme, kabul, reddetme, kontenjan kontrolü, üyeliğe dönüşüm |
| [development.md](./development.md) | Geliştirme akışı, sık karşılaşılan tuzaklar (tsx watch, content-type parser, response schema vb.) |

## 🚦 Hızlı Başvuru

- **"Yeni endpoint nasıl eklenir?"** → [development.md](./development.md) + [api.md](./api.md)
- **"AI çağrısı nasıl yapılır?"** → [ai-service.md](./ai-service.md)
- **"Davet kabul akışı nedir?"** → [features/invitations.md](./features/invitations.md)
- **"Hangi servisi hangi portta çalıştırırım?"** → [architecture.md](./architecture.md)

## 🛠 Çalıştırma — özet

Her servisin nasıl başlatıldığı kendi belgesinde ayrıntılı. En kısa hâli:

```bash
# Root'tan
pnpm install
pnpm dev                      # Web + API + Mobile (turborepo)

# AI servisi ayrı (Python)
cd apps/ai-service
source .venv/bin/activate
python main.py                # 3002'de
```

> Port standardı: **web 3000 · api 3001 · ai 3002 · postgres 5432**.
> Daha fazla detay → [architecture.md](./architecture.md).
