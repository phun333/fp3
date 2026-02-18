import { FastifyPluginAsync } from "fastify";
import { auth } from "../lib/auth";
import { toNodeHandler } from "better-auth/node";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const nodeHandler = toNodeHandler(auth);

  // Auth route'larında Fastify'ın body parsing'ini devre dışı bırak
  // Böylece Better Auth raw stream'den body'yi kendisi okuyabilir
  fastify.removeAllContentTypeParsers();
  fastify.addContentTypeParser("*", function (_request, _payload, done) {
    done(null);
  });

  // Email domain doğrulama - Better Auth'un hook sistemi ile
  // (preHandler'da body okumak stream'i bozar, bu yüzden
  //  domain kontrolünü Better Auth config'inde yapıyoruz)

  // Better Auth handler - tüm /api/auth/* isteklerini yakala
  fastify.all(
    "/api/auth/*",
    {
      schema: { hide: true },
      config: { rawBody: true },
    },
    async (request, reply) => {
      // reply.hijack() Fastify CORS'u bypass eder, CORS header'larını elle ekle
      const origin = request.headers.origin;
      const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"];
      if (origin && allowedOrigins.includes(origin)) {
        reply.raw.setHeader("Access-Control-Allow-Origin", origin);
        reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
        reply.raw.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        reply.raw.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      }

      // OPTIONS preflight
      if (request.method === "OPTIONS") {
        reply.raw.statusCode = 204;
        reply.raw.end();
        return reply.hijack();
      }

      await nodeHandler(request.raw, reply.raw);
      reply.hijack();
    }
  );
};

export default authRoutes;
