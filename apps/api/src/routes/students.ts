import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { searchSchema } from "@fp3/validation";
import { paginationMeta, paginationArgs } from "../lib/pagination";

const studentRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/students — öğrenci listesi
  fastify.get("/api/students", {
    schema: {
      tags: ["Öğrenciler"],
      summary: "Öğrenci listesi",
      description: "Filtreleme, arama ve sayfalama destekli öğrenci listesi",
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

    const where: any = { role: "STUDENT" };

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

    const [total, students] = await Promise.all([
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
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      success: true,
      data: students.map((s) => ({
        ...s,
        tags: s.tags.map((ut) => ut.tag),
      })),
      meta: paginationMeta(total, page, limit),
    };
  });

  // GET /api/students/:id — öğrenci detayı
  fastify.get("/api/students/:id", {
    schema: {
      tags: ["Öğrenciler"],
      summary: "Öğrenci detayı",
      description: "Öğrencinin profili ve başvurularıyla birlikte detay bilgisi",
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

    const student = await prisma.user.findFirst({
      where: { id, role: "STUDENT" },
      include: {
        tags: { include: { tag: true } },
        applications: {
          include: {
            project: {
              include: { tags: { include: { tag: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return reply.status(404).send({ success: false, error: "Öğrenci bulunamadı" });
    }

    return {
      success: true,
      data: {
        ...student,
        tags: student.tags.map((ut) => ut.tag),
        applications: student.applications.map((app) => ({
          ...app,
          project: {
            ...app.project,
            tags: app.project.tags.map((pt) => pt.tag),
          },
        })),
      },
    };
  });
};

export default studentRoutes;
