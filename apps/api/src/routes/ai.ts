import { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../middleware/auth";
import { aiExtractTagsSchema, aiAnalyzeProfileSchema } from "@fp3/validation";

// FP3 port standardı: AI servisi 3002'de çalışır.
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:3002";

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/ai/suggest-tags — AI tag önerisi (proxy)
  fastify.post(
    "/api/ai/suggest-tags",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["AI"],
        summary: "AI tag önerisi",
        description: "Metin girişinden KeyBERT + sentence-transformers ile otomatik tag önerileri çıkarır",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", description: "Analiz edilecek metin (proje açıklaması, biyografi vb.)" },
            topN: { type: "integer", default: 5, description: "Döndürülecek maksimum tag sayısı" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: { $ref: "ApiError#" },
          401: { $ref: "ApiError#" },
          503: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const parsed = aiExtractTagsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      try {
        const res = await fetch(`${AI_SERVICE_URL}/api/ai/extract-tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return reply.status(res.status as any).send({
            success: false,
            error: (err as any).detail || "AI servisi hatası",
          });
        }

        const data = await res.json();
        return { success: true, data };
      } catch (err: any) {
        return reply.status(503).send({
          success: false,
          error: "AI servisi şu anda erişilemez",
        });
      }
    }
  );

  // POST /api/ai/analyze-profile — profil analizi (proxy)
  fastify.post(
    "/api/ai/analyze-profile",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["AI"],
        summary: "Profil analizi",
        description: "Kullanıcı profilini analiz ederek ilgi alanı önerileri sunar",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["bio"],
          properties: {
            bio: { type: "string", description: "Kullanıcı biyografisi" },
            tags: { type: "array", items: { type: "string" }, description: "Mevcut tag'ler" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: { $ref: "ApiError#" },
          401: { $ref: "ApiError#" },
          503: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const parsed = aiAnalyzeProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      try {
        const res = await fetch(`${AI_SERVICE_URL}/api/ai/analyze-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return reply.status(res.status as any).send({
            success: false,
            error: (err as any).detail || "AI servisi hatası",
          });
        }

        const data = await res.json();
        return { success: true, data };
      } catch (err: any) {
        return reply.status(503).send({
          success: false,
          error: "AI servisi şu anda erişilemez",
        });
      }
    }
  );

  // GET /api/ai/health — AI servis durumu (proxy)
  fastify.get("/api/ai/health", {
    schema: {
      tags: ["AI"],
      summary: "AI servis durumu",
      description: "AI servisinin (Python FastAPI) çalışıp çalışmadığını kontrol eder",
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object", additionalProperties: true },
          },
        },
        503: { $ref: "ApiError#" },
      },
    },
  }, async (request, reply) => {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/api/ai/health`);
      const data = await res.json();
      return { success: true, data };
    } catch {
      return reply.status(503).send({
        success: false,
        error: "AI servisi şu anda erişilemez",
      });
    }
  });

  // POST /api/ai/reload-tags — tag cache yenile (proxy)
  fastify.post(
    "/api/ai/reload-tags",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["AI"],
        summary: "Tag cache'ini yenile",
        description: "AI servisindeki tag embedding cache'ini günceller",
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          503: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      try {
        const res = await fetch(`${AI_SERVICE_URL}/api/ai/reload-tags`, {
          method: "POST",
        });
        const data = await res.json();
        return { success: true, data };
      } catch {
        return reply.status(503).send({
          success: false,
          error: "AI servisi şu anda erişilemez",
        });
      }
    }
  );
};

export default aiRoutes;
