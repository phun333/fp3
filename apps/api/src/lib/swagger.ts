import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import fastifySwagger from "@fastify/swagger";
import scalarApiReference from "@scalar/fastify-api-reference";

const API_DESCRIPTION = `
**FP3** — Finding Publication Project Partner

Üniversite öğrencileri ve akademisyenler arasında makale/proje ortaklığı kuran
tag tabanlı eşleştirme platformunun REST API'si.

### Auth
Çoğu endpoint **session cookie** (\`credentials: "include"\`) veya
**Bearer token** (\`Authorization: Bearer <token>\`) ile çağrılır.
Sadece \`@ostimteknik.edu.tr\` mail adresleriyle kayıt olunabilir.

### Yanıt formatı
Tüm yanıtlar şu yapıdadır:
\`\`\`json
{ "success": true,  "data": ... }                    // başarılı
{ "success": false, "error": "açıklama" }            // hata
\`\`\`

Sayfalı yanıtlar ek olarak \`meta: { page, limit, total, totalPages }\` döner.

### Port standardı (FP3)
| Servis | Port |
|--------|------|
| Web    | 3000 |
| API    | 3001 |
| AI     | 3002 |
| DB     | 5432 |
`;

async function swaggerPlugin(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "FP3 API",
        description: API_DESCRIPTION,
        version: "1.0.0",
        contact: {
          name: "FP3 Team",
          url: "https://github.com/ostimteknik/fp3",
        },
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3001}`,
          description: "Geliştirme sunucusu",
        },
      ],
      tags: [
        { name: "Sistem", description: "Sağlık kontrolü ve genel sistem endpoint'leri" },
        { name: "Auth", description: "Kayıt, giriş, çıkış ve oturum bilgisi" },
        { name: "Profil", description: "Kendi profilim ve diğer kullanıcıların profilleri" },
        { name: "Akademisyenler", description: "Hoca listesi, detayı ve filtreleri" },
        { name: "Öğrenciler", description: "Öğrenci listesi ve detayı" },
        { name: "Projeler", description: "Proje CRUD, üyelik ve kontenjan yönetimi" },
        { name: "Yayınlar", description: "Akademik yayın CRUD" },
        { name: "Başvurular", description: "Öğrenci/hoca → proje başvuruları" },
        { name: "Davetler", description: "Proje sahibinin gönderdiği davetler" },
        { name: "Hoca Başvuruları", description: "Öğrenci → hoca proje önerisi akışı" },
        { name: "Etiketler", description: "Tag listesi ve kategori grupları" },
        { name: "Keşfet", description: "Tag bazlı öneri akışları (discover)" },
        { name: "Eşleştirme", description: "Matching algoritmaları (öğrenci → hoca, hoca → ekip)" },
        { name: "Ekip Kurma", description: "Matching wizard çıktısı: TeamIdea + Project + ProjectInvite" },
        { name: "Kayıtlı Eşleşmeler", description: "Öğrencinin kaydettiği hocalar" },
        { name: "AI", description: "Tag önerisi ve profil analizi (Python servisine proxy)" },
        { name: "Kullanıcılar", description: "Kullanıcı arama (davet hedefi seçimi)" },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "fp3.session_token",
            description: "Better Auth session cookie (web)",
          },
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            description: "Better Auth Bearer token (mobile)",
          },
        },
      },
    },
  });

  await app.register(scalarApiReference, {
    routePrefix: "/docs",
    configuration: {
      theme: "purple",
      layout: "modern",
      hideDownloadButton: false,
      defaultHttpClient: { targetKey: "javascript", clientKey: "fetch" },
    },
  });
}

// fastify-plugin ile sarıyoruz ki encapsulation olmasın
// (yoksa swagger sadece kendi child context'indeki route'ları görür ve
// /docs sayfası boş çıkar)
export const setupSwagger = fp(swaggerPlugin, {
  name: "fp3-swagger",
  fastify: "5.x",
});
