import { FastifyPluginAsync } from "fastify";
import { auth } from "../lib/auth";
import { toNodeHandler } from "better-auth/node";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Email domain doğrulama - signup isteğini intercept et
  fastify.addHook("preHandler", async (request, reply) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    
    // Sadece signup endpoint'inde domain kontrolü yap
    if (url.pathname === "/api/auth/sign-up/email" && request.method === "POST") {
      const body = request.body as any;
      const email = body?.email;

      if (email && !email.endsWith("@ostimteknik.edu.tr")) {
        return reply.status(400).send({
          success: false,
          error: "Sadece @ostimteknik.edu.tr uzantılı e-posta adresleri kabul edilir",
        });
      }

      // Rol kontrolü
      const role = body?.role;
      if (role && !["STUDENT", "PROFESSOR"].includes(role)) {
        return reply.status(400).send({
          success: false,
          error: "Geçersiz rol. STUDENT veya PROFESSOR seçmelisiniz",
        });
      }
    }
  });

  // Better Auth handler - tüm /api/auth/* isteklerini yakala
  const nodeHandler = toNodeHandler(auth);

  fastify.all("/api/auth/*", { schema: { hide: true } }, async (request, reply) => {
    // Fastify raw req/res'i node handler'a ilet
    await nodeHandler(request.raw, reply.raw);
    // reply zaten gönderildi, Fastify'a bunu bildir
    reply.hijack();
  });
};

export default authRoutes;
