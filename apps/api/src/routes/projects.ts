import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createProjectSchema,
  updateProjectSchema,
  projectSearchSchema,
} from "@fp3/validation";
import { paginationMeta, paginationArgs } from "../lib/pagination";

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/projects — yeni proje oluştur (sadece PROFESSOR)
  fastify.post(
    "/api/projects",
    {
      preHandler: requireRole("PROFESSOR"),
      schema: {
        tags: ["Projeler"],
        summary: "Yeni proje oluştur",
        description: "Sadece PROFESSOR rolündeki kullanıcılar proje oluşturabilir",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["title", "description", "tagIds"],
          properties: {
            title: { type: "string", minLength: 3 },
            description: { type: "string", minLength: 10 },
            maxMembers: { type: "integer", minimum: 1, default: 3 },
            tagIds: { type: "array", items: { type: "string", format: "uuid" } },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "Project#" },
            },
          },
          400: { $ref: "ApiError#" },
          401: { $ref: "ApiError#" },
          403: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const parsed = createProjectSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      const { tagIds, ...data } = parsed.data;

      const project = await prisma.project.create({
        data: {
          ...data,
          ownerId: request.user!.id,
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: {
          tags: { include: { tag: true } },
          owner: {
            select: { id: true, name: true, department: true, avatarUrl: true },
          },
        },
      });

      return {
        success: true,
        data: {
          ...project,
          tags: project.tags.map((pt) => pt.tag),
        },
      };
    }
  );

  // GET /api/projects — proje listesi
  fastify.get("/api/projects", {
    schema: {
      tags: ["Projeler"],
      summary: "Proje listesi",
      description: "Filtreleme, arama ve sayfalama destekli proje listesi",
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1, minimum: 1 },
          limit: { type: "integer", default: 10, minimum: 1, maximum: 50 },
          search: { type: "string", description: "Başlık veya açıklamada arama" },
          tags: { type: "string", description: "Virgülle ayrılmış tag ID'leri" },
          status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array", items: { $ref: "Project#" } },
            meta: { $ref: "PaginationMeta#" },
          },
        },
        400: { $ref: "ApiError#" },
      },
    },
  }, async (request, reply) => {
    const parsed = projectSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
    }

    const { page, limit, search, tags, status } = parsed.data;
    const tagIds = tags ? tags.split(",").filter(Boolean) : [];

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tagIds.length > 0) {
      where.tags = {
        some: { tagId: { in: tagIds } },
      };
    }

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        ...paginationArgs(page, limit),
        include: {
          tags: { include: { tag: true } },
          owner: {
            select: { id: true, name: true, department: true, avatarUrl: true },
          },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      success: true,
      data: projects.map((p) => ({
        ...p,
        tags: p.tags.map((pt) => pt.tag),
      })),
      meta: paginationMeta(total, page, limit),
    };
  });

  // GET /api/projects/:id — proje detayı
  fastify.get("/api/projects/:id", {
    schema: {
      tags: ["Projeler"],
      summary: "Proje detayı",
      description: "Belirtilen projenin detay bilgilerini, tag'lerini, sahibini ve başvurularını döner",
      params: {
        type: "object",
        properties: { id: { type: "string", format: "uuid" } },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { $ref: "Project#" },
          },
        },
        404: { $ref: "ApiError#" },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        owner: {
          select: { id: true, name: true, email: true, department: true, avatarUrl: true },
        },
        applications: {
          include: {
            applicant: {
              select: { id: true, name: true, department: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!project) {
      return reply.status(404).send({ success: false, error: "Proje bulunamadı" });
    }

    return {
      success: true,
      data: {
        ...project,
        tags: project.tags.map((pt) => pt.tag),
      },
    };
  });

  // PUT /api/projects/:id — proje güncelle (sadece owner)
  fastify.put(
    "/api/projects/:id",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Projeler"],
        summary: "Proje güncelle",
        description: "Sadece proje sahibi güncelleyebilir",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string", format: "uuid" } },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
            maxMembers: { type: "integer" },
            tagIds: { type: "array", items: { type: "string", format: "uuid" } },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "Project#" },
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
      const parsed = updateProjectSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      // Ownership kontrolü
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ success: false, error: "Proje bulunamadı" });
      }
      if (existing.ownerId !== request.user!.id) {
        return reply.status(403).send({ success: false, error: "Bu projeyi düzenleme yetkiniz yok" });
      }

      const { tagIds, ...data } = parsed.data;

      const project = await prisma.project.update({
        where: { id },
        data: {
          ...data,
          ...(tagIds && {
            tags: {
              deleteMany: {},
              create: tagIds.map((tagId) => ({ tagId })),
            },
          }),
        },
        include: {
          tags: { include: { tag: true } },
          owner: {
            select: { id: true, name: true, department: true, avatarUrl: true },
          },
        },
      });

      return {
        success: true,
        data: {
          ...project,
          tags: project.tags.map((pt) => pt.tag),
        },
      };
    }
  );

  // DELETE /api/projects/:id — proje sil (sadece owner)
  fastify.delete(
    "/api/projects/:id",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Projeler"],
        summary: "Proje sil",
        description: "Sadece proje sahibi silebilir",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string", format: "uuid" } },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: { message: { type: "string" } },
              },
            },
          },
          403: { $ref: "ApiError#" },
          404: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ success: false, error: "Proje bulunamadı" });
      }
      if (existing.ownerId !== request.user!.id) {
        return reply.status(403).send({ success: false, error: "Bu projeyi silme yetkiniz yok" });
      }

      await prisma.project.delete({ where: { id } });

      return { success: true, data: { message: "Proje silindi" } };
    }
  );
};

export default projectRoutes;
