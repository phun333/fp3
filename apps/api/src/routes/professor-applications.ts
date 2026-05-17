import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

/**
 * Öğrencinin matching sonucundan bir hocaya doğrudan başvurusu.
 * Hoca kabul edince otomatik bir proje oluşur ve öğrenci member olarak eklenir.
 */
const professorApplicationRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/professor-applications — öğrenci hocaya başvuru gönderir
  fastify.post(
    "/api/professor-applications",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Hoca Başvuruları"],
        summary: "Hocaya başvur",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["professorId", "title", "description", "tagIds"],
          properties: {
            professorId: { type: "string" },
            purpose: { type: "string", enum: ["PROJECT", "ARTICLE"], default: "PROJECT" },
            title: { type: "string", minLength: 5 },
            description: { type: "string", minLength: 10 },
            tagIds: { type: "array", items: { type: "string" }, minItems: 1 },
            message: { type: "string", nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        professorId: string;
        purpose?: "PROJECT" | "ARTICLE";
        title: string;
        description: string;
        tagIds: string[];
        message?: string;
      };

      const prof = await prisma.user.findUnique({
        where: { id: body.professorId },
        select: { id: true, role: true },
      });
      if (!prof || prof.role !== "PROFESSOR") {
        return reply.status(404).send({
          success: false,
          error: "Akademisyen bulunamadı",
        });
      }

      // Aynı hocaya bekleyen başvuru var mı
      const existingPending = await prisma.professorApplication.findFirst({
        where: {
          studentId: request.user!.id,
          professorId: body.professorId,
          status: "PENDING",
        },
      });
      if (existingPending) {
        return reply.status(409).send({
          success: false,
          error: "Bu hocaya zaten bekleyen bir başvurun var",
        });
      }

      const created = await prisma.professorApplication.create({
        data: {
          studentId: request.user!.id,
          professorId: body.professorId,
          purpose: body.purpose ?? "PROJECT",
          title: body.title,
          description: body.description,
          tagIds: body.tagIds.join(","),
          message: body.message ?? null,
        },
        include: {
          professor: {
            select: { id: true, name: true, department: true, avatarUrl: true },
          },
        },
      });

      return { success: true, data: created };
    }
  );

  // GET /api/professor-applications/incoming — hocaya gelen başvurular
  fastify.get(
    "/api/professor-applications/incoming",
    {
      preHandler: requireRole("PROFESSOR"),
      schema: {
        tags: ["Hoca Başvuruları"],
        summary: "Gelen hoca başvuruları",
        security: [{ cookieAuth: [] }],
      },
    },
    async (request) => {
      const apps = await prisma.professorApplication.findMany({
        where: { professorId: request.user!.id },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              year: true,
              bio: true,
              avatarUrl: true,
              tags: { include: { tag: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // tagIds'leri çöz
      const allTagIds = Array.from(
        new Set(apps.flatMap((a) => a.tagIds.split(",").filter(Boolean)))
      );
      const tags = await prisma.tag.findMany({
        where: { id: { in: allTagIds } },
      });
      const tagMap = new Map(tags.map((t) => [t.id, t]));

      return {
        success: true,
        data: apps.map((a) => ({
          ...a,
          tagIdList: a.tagIds.split(",").filter(Boolean),
          tags: a.tagIds
            .split(",")
            .filter(Boolean)
            .map((id) => tagMap.get(id))
            .filter(Boolean),
          student: {
            ...a.student,
            tags: a.student.tags.map((ut) => ut.tag),
          },
        })),
      };
    }
  );

  // GET /api/professor-applications/mine — öğrencinin gönderdiği başvurular
  fastify.get(
    "/api/professor-applications/mine",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Hoca Başvuruları"],
        summary: "Hocalara gönderdiğim başvurular",
        security: [{ cookieAuth: [] }],
      },
    },
    async (request) => {
      const apps = await prisma.professorApplication.findMany({
        where: { studentId: request.user!.id },
        include: {
          professor: {
            select: { id: true, name: true, department: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return {
        success: true,
        data: apps.map((a) => ({
          ...a,
          tagIdList: a.tagIds.split(",").filter(Boolean),
        })),
      };
    }
  );

  // PUT /api/professor-applications/:id — hoca kabul / reddet
  fastify.put(
    "/api/professor-applications/:id",
    {
      preHandler: requireRole("PROFESSOR"),
      schema: {
        tags: ["Hoca Başvuruları"],
        summary: "Başvuruya yanıt ver",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ACCEPTED", "REJECTED"] },
            studentSlots: { type: "integer", minimum: 0 },
            professorSlots: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status, studentSlots, professorSlots } = request.body as {
        status: "ACCEPTED" | "REJECTED";
        studentSlots?: number;
        professorSlots?: number;
      };

      const app = await prisma.professorApplication.findUnique({
        where: { id },
      });
      if (!app) {
        return reply.status(404).send({ success: false, error: "Başvuru bulunamadı" });
      }
      if (app.professorId !== request.user!.id) {
        return reply.status(403).send({ success: false, error: "Yetkiniz yok" });
      }
      if (app.status !== "PENDING") {
        return reply.status(400).send({
          success: false,
          error: "Bu başvuru zaten yanıtlanmış",
        });
      }

      if (status === "REJECTED") {
        const updated = await prisma.professorApplication.update({
          where: { id },
          data: { status: "REJECTED" },
        });
        return { success: true, data: updated };
      }

      // ACCEPTED: yeni proje oluştur + öğrenciyi üye yap (transaction)
      const tagIds = app.tagIds.split(",").filter(Boolean);

      const result = await prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            title: app.title,
            description: app.description,
            ownerId: request.user!.id,
            studentSlots: studentSlots ?? 2,
            professorSlots: professorSlots ?? 1,
            tags: { create: tagIds.map((t) => ({ tagId: t })) },
            members: {
              create: [
                { userId: request.user!.id, role: "PROFESSOR" },
                { userId: app.studentId, role: "STUDENT" },
              ],
            },
          },
          include: {
            tags: { include: { tag: true } },
            members: { include: { user: { select: { id: true, name: true, role: true } } } },
          },
        });

        const updatedApp = await tx.professorApplication.update({
          where: { id },
          data: {
            status: "ACCEPTED",
            createdProjectId: project.id,
          },
        });

        return { project, application: updatedApp };
      });

      return {
        success: true,
        data: {
          ...result.application,
          project: {
            ...result.project,
            tags: result.project.tags.map((pt) => pt.tag),
          },
        },
      };
    }
  );
};

export default professorApplicationRoutes;
