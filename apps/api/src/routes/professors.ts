import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { searchSchema } from "@fp3/validation";
import { paginationMeta, paginationArgs } from "../lib/pagination";

const professorRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/professors — hoca listesi
  fastify.get("/api/professors", {
    schema: {
      tags: ["Akademisyenler"],
      summary: "Akademisyen listesi",
      description: "Filtreleme, arama ve sayfalama destekli akademisyen listesi",
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 10 },
          search: { type: "string", description: "Ad, bölüm veya biyografide arama" },
          tags: { type: "string", description: "Virgülle ayrılmış tag ID'leri" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array", items: { $ref: "User#" } },
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

    const where: any = { role: "PROFESSOR" };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tagIds.length > 0) {
      where.tags = {
        some: { tagId: { in: tagIds } },
      };
    }

    const [total, professors] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        ...paginationArgs(page, limit),
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          tags: { include: { tag: true } },
          _count: {
            select: { projects: true, publications: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      success: true,
      data: professors.map((p) => ({
        ...p,
        tags: p.tags.map((ut) => ut.tag),
      })),
      meta: paginationMeta(total, page, limit),
    };
  });

  // GET /api/professors/:id — hoca detayı
  fastify.get("/api/professors/:id", {
    schema: {
      tags: ["Akademisyenler"],
      summary: "Akademisyen detayı",
      description: "Akademisyenin profili, projeleri ve yayınları ile birlikte detay bilgisi",
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
            data: { $ref: "User#" },
          },
        },
        404: { $ref: "ApiError#" },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const professor = await prisma.user.findFirst({
      where: { id, role: "PROFESSOR" },
      include: {
        tags: { include: { tag: true } },
        projects: {
          include: { tags: { include: { tag: true } } },
          orderBy: { createdAt: "desc" },
        },
        publications: {
          include: { tags: { include: { tag: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!professor) {
      return reply.status(404).send({ success: false, error: "Akademisyen bulunamadı" });
    }

    return {
      success: true,
      data: {
        ...professor,
        tags: professor.tags.map((ut) => ut.tag),
        projects: professor.projects.map((p) => ({
          ...p,
          tags: p.tags.map((pt) => pt.tag),
        })),
        publications: professor.publications.map((pub) => ({
          ...pub,
          tags: pub.tags.map((pt) => pt.tag),
        })),
      },
    };
  });
};

export default professorRoutes;
