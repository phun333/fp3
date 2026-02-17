import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createPublicationSchema,
  updatePublicationSchema,
  searchSchema,
} from "@fp3/validation";
import { paginationMeta, paginationArgs } from "../lib/pagination";

const publicationRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/publications — yayın ekle (sadece PROFESSOR)
  fastify.post(
    "/api/publications",
    {
      preHandler: requireRole("PROFESSOR"),
      schema: {
        tags: ["Yayınlar"],
        summary: "Yeni yayın ekle",
        description: "Sadece PROFESSOR rolündeki kullanıcılar yayın ekleyebilir",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["title", "tagIds"],
          properties: {
            title: { type: "string" },
            abstract: { type: "string", nullable: true },
            url: { type: "string", format: "uri", nullable: true },
            publishedAt: { type: "string", format: "date-time", nullable: true },
            tagIds: { type: "array", items: { type: "string", format: "uuid" } },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "Publication#" },
            },
          },
          400: { $ref: "ApiError#" },
          403: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const parsed = createPublicationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      const { tagIds, ...data } = parsed.data;

      const publication = await prisma.publication.create({
        data: {
          ...data,
          authorId: request.user!.id,
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: {
          tags: { include: { tag: true } },
          author: {
            select: { id: true, name: true, department: true },
          },
        },
      });

      return {
        success: true,
        data: {
          ...publication,
          tags: publication.tags.map((pt) => pt.tag),
        },
      };
    }
  );

  // GET /api/publications — yayın listesi
  fastify.get("/api/publications", {
    schema: {
      tags: ["Yayınlar"],
      summary: "Yayın listesi",
      description: "Filtreleme, arama ve sayfalama destekli yayın listesi",
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 10 },
          search: { type: "string", description: "Başlık veya özette arama" },
          tags: { type: "string", description: "Virgülle ayrılmış tag ID'leri" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array", items: { $ref: "Publication#" } },
            meta: { $ref: "PaginationMeta#" },
          },
        },
        400: { $ref: "ApiError#" },
      },
    },
  }, async (request, reply) => {
    const parsed = searchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
    }

    const { page, limit, search, tags } = parsed.data;
    const tagIds = tags ? tags.split(",").filter(Boolean) : [];

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { abstract: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tagIds.length > 0) {
      where.tags = {
        some: { tagId: { in: tagIds } },
      };
    }

    const [total, publications] = await Promise.all([
      prisma.publication.count({ where }),
      prisma.publication.findMany({
        where,
        ...paginationArgs(page, limit),
        include: {
          tags: { include: { tag: true } },
          author: {
            select: { id: true, name: true, department: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      success: true,
      data: publications.map((pub) => ({
        ...pub,
        tags: pub.tags.map((pt) => pt.tag),
      })),
      meta: paginationMeta(total, page, limit),
    };
  });

  // GET /api/publications/:id — yayın detayı
  fastify.get("/api/publications/:id", {
    schema: {
      tags: ["Yayınlar"],
      summary: "Yayın detayı",
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
            data: { $ref: "Publication#" },
          },
        },
        404: { $ref: "ApiError#" },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const publication = await prisma.publication.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        author: {
          select: { id: true, name: true, email: true, department: true, avatarUrl: true },
        },
      },
    });

    if (!publication) {
      return reply.status(404).send({ success: false, error: "Yayın bulunamadı" });
    }

    return {
      success: true,
      data: {
        ...publication,
        tags: publication.tags.map((pt) => pt.tag),
      },
    };
  });

  // PUT /api/publications/:id — yayın güncelle (sadece owner)
  fastify.put(
    "/api/publications/:id",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Yayınlar"],
        summary: "Yayın güncelle",
        description: "Sadece yayın sahibi güncelleyebilir",
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
            abstract: { type: "string", nullable: true },
            url: { type: "string", nullable: true },
            publishedAt: { type: "string", nullable: true },
            tagIds: { type: "array", items: { type: "string", format: "uuid" } },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "Publication#" },
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
      const parsed = updatePublicationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      const existing = await prisma.publication.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ success: false, error: "Yayın bulunamadı" });
      }
      if (existing.authorId !== request.user!.id) {
        return reply.status(403).send({ success: false, error: "Bu yayını düzenleme yetkiniz yok" });
      }

      const { tagIds, ...data } = parsed.data;

      const publication = await prisma.publication.update({
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
          author: {
            select: { id: true, name: true, department: true },
          },
        },
      });

      return {
        success: true,
        data: {
          ...publication,
          tags: publication.tags.map((pt) => pt.tag),
        },
      };
    }
  );

  // DELETE /api/publications/:id — yayın sil (sadece owner)
  fastify.delete(
    "/api/publications/:id",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Yayınlar"],
        summary: "Yayın sil",
        description: "Sadece yayın sahibi silebilir",
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
              data: { type: "object", properties: { message: { type: "string" } } },
            },
          },
          403: { $ref: "ApiError#" },
          404: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const existing = await prisma.publication.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ success: false, error: "Yayın bulunamadı" });
      }
      if (existing.authorId !== request.user!.id) {
        return reply.status(403).send({ success: false, error: "Bu yayını silme yetkiniz yok" });
      }

      await prisma.publication.delete({ where: { id } });

      return { success: true, data: { message: "Yayın silindi" } };
    }
  );
};

export default publicationRoutes;
