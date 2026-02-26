import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
  paginationSchema,
} from "@fp3/validation";
import { paginationMeta, paginationArgs } from "../lib/pagination";

const applicationRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/projects/:id/apply — projeye başvur (sadece STUDENT)
  fastify.post(
    "/api/projects/:id/apply",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Başvurular"],
        summary: "Projeye başvur",
        description: "Sadece STUDENT rolündeki kullanıcılar başvurabilir. Aynı projeye birden fazla başvuru yapılamaz",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string", description: "Proje ID" } },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            message: { type: "string", description: "Başvuru mesajı", nullable: true },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "Application#" },
            },
          },
          400: { $ref: "ApiError#" },
          404: { $ref: "ApiError#" },
          409: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const { id: projectId } = request.params as { id: string };
      const parsed = createApplicationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      // Proje var mı ve açık mı
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { _count: { select: { applications: { where: { status: "ACCEPTED" } } } } },
      });

      if (!project) {
        return reply.status(404).send({ success: false, error: "Proje bulunamadı" });
      }

      if (project.status !== "OPEN") {
        return reply.status(400).send({ success: false, error: "Bu proje başvuruya kapalı" });
      }

      // Zaten başvurmuş mu
      const existing = await prisma.application.findUnique({
        where: {
          projectId_applicantId: {
            projectId,
            applicantId: request.user!.id,
          },
        },
      });

      if (existing) {
        return reply.status(409).send({ success: false, error: "Bu projeye zaten başvurdunuz" });
      }

      const application = await prisma.application.create({
        data: {
          projectId,
          applicantId: request.user!.id,
          message: parsed.data.message,
        },
        include: {
          project: {
            select: { id: true, title: true },
          },
          applicant: {
            select: { id: true, name: true, department: true },
          },
        },
      });

      return { success: true, data: application };
    }
  );

  // GET /api/projects/:id/applications — başvuruları listele (project owner)
  fastify.get(
    "/api/projects/:id/applications",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Başvurular"],
        summary: "Proje başvurularını listele",
        description: "Sadece proje sahibi görebilir",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string", description: "Proje ID" } },
          required: ["id"],
        },
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", default: 1 },
            limit: { type: "integer", default: 10 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: { $ref: "Application#" } },
              meta: { $ref: "PaginationMeta#" },
            },
          },
          400: { $ref: "ApiError#" },
          403: { $ref: "ApiError#" },
          404: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const { id: projectId } = request.params as { id: string };
      const parsed = paginationSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
      }

      // Ownership kontrolü
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return reply.status(404).send({ success: false, error: "Proje bulunamadı" });
      }
      if (project.ownerId !== request.user!.id) {
        return reply.status(403).send({ success: false, error: "Bu projenin başvurularını görme yetkiniz yok" });
      }

      const { page, limit } = parsed.data;

      const [total, applications] = await Promise.all([
        prisma.application.count({ where: { projectId } }),
        prisma.application.findMany({
          where: { projectId },
          ...paginationArgs(page, limit),
          include: {
            applicant: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                bio: true,
                avatarUrl: true,
                tags: { include: { tag: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        success: true,
        data: applications.map((app) => ({
          ...app,
          applicant: {
            ...app.applicant,
            tags: app.applicant.tags.map((ut) => ut.tag),
          },
        })),
        meta: paginationMeta(total, page, limit),
      };
    }
  );

  // PUT /api/applications/:id — başvuru durumunu güncelle (project owner)
  fastify.put(
    "/api/applications/:id",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Başvurular"],
        summary: "Başvuru durumunu güncelle",
        description: "Proje sahibi başvuruyu kabul veya reddedebilir",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string", description: "Başvuru ID" } },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ACCEPTED", "REJECTED"] },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "Application#" },
            },
          },
          400: { $ref: "ApiError#" },
          403: { $ref: "ApiError#" },
          404: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateApplicationStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      const application = await prisma.application.findUnique({
        where: { id },
        include: { project: true },
      });

      if (!application) {
        return reply.status(404).send({ success: false, error: "Başvuru bulunamadı" });
      }

      if (application.project.ownerId !== request.user!.id) {
        return reply.status(403).send({ success: false, error: "Bu başvuruyu güncelleme yetkiniz yok" });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: { status: parsed.data.status },
        include: {
          project: { select: { id: true, title: true } },
          applicant: { select: { id: true, name: true, department: true } },
        },
      });

      return { success: true, data: updated };
    }
  );

  // GET /api/my-applications — kendi başvurularım (STUDENT)
  fastify.get(
    "/api/my-applications",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Başvurular"],
        summary: "Kendi başvurularım",
        description: "Öğrencinin yaptığı tüm başvuruları listeler",
        security: [{ cookieAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", default: 1 },
            limit: { type: "integer", default: 10 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: { $ref: "Application#" } },
              meta: { $ref: "PaginationMeta#" },
            },
          },
          400: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const parsed = paginationSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
      }

      const { page, limit } = parsed.data;

      const [total, applications] = await Promise.all([
        prisma.application.count({ where: { applicantId: request.user!.id } }),
        prisma.application.findMany({
          where: { applicantId: request.user!.id },
          ...paginationArgs(page, limit),
          include: {
            project: {
              include: {
                tags: { include: { tag: true } },
                owner: {
                  select: { id: true, name: true, department: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        success: true,
        data: applications.map((app) => ({
          ...app,
          project: {
            ...app.project,
            tags: app.project.tags.map((pt) => pt.tag),
          },
        })),
        meta: paginationMeta(total, page, limit),
      };
    }
  );
};

export default applicationRoutes;
