import type { FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import scalarApiReference from "@scalar/fastify-api-reference";

export async function setupSwagger(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "FP3 API",
        description: "Finding Publication Project Partner - API Dokümantasyonu",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 4000}`,
          description: "Geliştirme sunucusu",
        },
      ],
      tags: [
        { name: "Sistem", description: "Sistem endpoint'leri" },
        { name: "Auth", description: "Kimlik doğrulama" },
        { name: "Profil", description: "Kullanıcı profil işlemleri" },
        { name: "Profesörler", description: "Profesör işlemleri" },
        { name: "Öğrenciler", description: "Öğrenci işlemleri" },
        { name: "Projeler", description: "Proje işlemleri" },
        { name: "Yayınlar", description: "Yayın işlemleri" },
        { name: "Başvurular", description: "Başvuru işlemleri" },
        { name: "Etiketler", description: "Etiket işlemleri" },
        { name: "Keşfet", description: "Keşif ve eşleştirme" },
        { name: "AI", description: "Yapay zeka servisleri" },
      ],
    },
  });

  await app.register(scalarApiReference, {
    routePrefix: "/docs",
  });
}
