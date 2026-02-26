import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireRole } from "../middleware/auth";
import { saveMatchSchema, unsaveMatchSchema, paginationSchema } from "@fp3/validation";
import { paginationMeta, paginationArgs } from "../lib/pagination";

const savedMatchRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/saved-matches — eşleşme kaydet
  fastify.post(
    "/api/saved-matches",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Kayıtlı Eşleşmeler"],
        summary: "Eşleşme kaydet",
        description: "Öğrenci, eşleşen bir akademisyeni kaydeder",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["professorId", "purpose"],
          properties: {
            professorId: { type: "string" },
            purpose: { type: "string", enum: ["ARTICLE", "PROJECT"] },
            description: { type: "string" },
            matchScore: { type: "integer" },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = saveMatchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
      }

      const { professorId, purpose, description, matchScore } = parsed.data;

      // Hoca var mı kontrol
      const professor = await prisma.user.findUnique({
        where: { id: professorId },
      });
      if (!professor || professor.role !== "PROFESSOR") {
        return reply.status(404).send({ success: false, error: "Akademisyen bulunamadı" });
      }

      // Zaten kayıtlı mı
      const existing = await prisma.savedMatch.findUnique({
        where: {
          userId_professorId_purpose: {
            userId: request.user!.id,
            professorId,
            purpose,
          },
        },
      });

      if (existing) {
        return reply.status(409).send({ success: false, error: "Bu eşleşme zaten kayıtlı" });
      }

      const saved = await prisma.savedMatch.create({
        data: {
          userId: request.user!.id,
          professorId,
          purpose,
          description,
          matchScore,
        },
        include: {
          professor: {
            select: {
              id: true,
              name: true,
              department: true,
              bio: true,
              avatarUrl: true,
              tags: { include: { tag: true } },
              _count: { select: { projects: true, publications: true } },
            },
          },
        },
      });

      return {
        success: true,
        data: {
          ...saved,
          professor: {
            ...saved.professor,
            tags: saved.professor.tags.map((ut) => ut.tag),
          },
        },
      };
    }
  );

  // DELETE /api/saved-matches — eşleşme kaydını sil
  fastify.delete(
    "/api/saved-matches",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Kayıtlı Eşleşmeler"],
        summary: "Kayıtlı eşleşmeyi sil",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["professorId", "purpose"],
          properties: {
            professorId: { type: "string" },
            purpose: { type: "string", enum: ["ARTICLE", "PROJECT"] },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = unsaveMatchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
      }

      const { professorId, purpose } = parsed.data;

      const existing = await prisma.savedMatch.findUnique({
        where: {
          userId_professorId_purpose: {
            userId: request.user!.id,
            professorId,
            purpose,
          },
        },
      });

      if (!existing) {
        return reply.status(404).send({ success: false, error: "Kayıtlı eşleşme bulunamadı" });
      }

      await prisma.savedMatch.delete({
        where: { id: existing.id },
      });

      return { success: true, message: "Eşleşme kaydı silindi" };
    }
  );

  // GET /api/saved-matches — kayıtlı eşleşmeleri listele
  fastify.get(
    "/api/saved-matches",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Kayıtlı Eşleşmeler"],
        summary: "Kayıtlı eşleşmeleri listele",
        security: [{ cookieAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", default: 1 },
            limit: { type: "integer", default: 20 },
            purpose: { type: "string", enum: ["ARTICLE", "PROJECT"] },
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as any;
      const parsed = paginationSchema.safeParse(query);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
      }

      const { page, limit } = parsed.data;
      const where: any = { userId: request.user!.id };
      if (query.purpose) where.purpose = query.purpose;

      const [total, savedMatches] = await Promise.all([
        prisma.savedMatch.count({ where }),
        prisma.savedMatch.findMany({
          where,
          ...paginationArgs(page, limit),
          include: {
            professor: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                bio: true,
                avatarUrl: true,
                role: true,
                tags: { include: { tag: true } },
                _count: { select: { projects: true, publications: true } },
                projects: {
                  where: { status: "OPEN" },
                  select: { id: true, title: true, description: true, status: true },
                  take: 3,
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        success: true,
        data: savedMatches.map((sm) => ({
          ...sm,
          professor: {
            ...sm.professor,
            tags: sm.professor.tags.map((ut) => ut.tag),
          },
        })),
        meta: paginationMeta(total, page, limit),
      };
    }
  );

  // GET /api/saved-matches/ids — kayıtlı prof ID'lerini getir (hızlı kontrol için)
  fastify.get(
    "/api/saved-matches/ids",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Kayıtlı Eşleşmeler"],
        summary: "Kayıtlı eşleşme ID'leri",
        description: "Frontend'de hızlı 'kayıtlı mı?' kontrolü için",
        security: [{ cookieAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            purpose: { type: "string", enum: ["ARTICLE", "PROJECT"] },
          },
        },
      },
    },
    async (request) => {
      const query = request.query as any;
      const where: any = { userId: request.user!.id };
      if (query.purpose) where.purpose = query.purpose;

      const saved = await prisma.savedMatch.findMany({
        where,
        select: { professorId: true, purpose: true },
      });

      return {
        success: true,
        data: saved,
      };
    }
  );
};

export default savedMatchRoutes;
