import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { paginationSchema } from "@fp3/validation";
import { paginationMeta, paginationArgs } from "../lib/pagination";

const discoverRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/discover/professors — öğrenci tag'lerine göre önerilen hocalar
  fastify.get(
    "/api/discover/professors",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Keşfet"],
        summary: "Önerilen akademisyenler",
        description: "Öğrencinin tag'lerine göre eşleşme skoru hesaplanmış akademisyen listesi. matchScore alanı yüzdelik eşleşme oranını gösterir",
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
              data: { type: "array", items: { $ref: "User#" } },
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

      // Öğrencinin tag'lerini al
      const userTags = await prisma.userTag.findMany({
        where: { userId: request.user!.id },
        select: { tagId: true },
      });
      const userTagIds = userTags.map((ut) => ut.tagId);

      if (userTagIds.length === 0) {
        return {
          success: true,
          data: [],
          meta: paginationMeta(0, page, limit),
          message: "Öneri almak için profilinize tag ekleyin",
        };
      }

      // Tag kesişimine göre hocaları bul ve sırala
      const professors = await prisma.user.findMany({
        where: {
          role: "PROFESSOR",
          tags: { some: { tagId: { in: userTagIds } } },
        },
        include: {
          tags: { include: { tag: true } },
          _count: { select: { projects: true, publications: true } },
        },
      });

      // Eşleşme skoru hesapla
      const scored = professors.map((prof) => {
        const profTagIds = prof.tags.map((ut) => ut.tagId);
        const commonTags = profTagIds.filter((id) => userTagIds.includes(id));
        const matchScore = Math.round(
          (commonTags.length / Math.max(userTagIds.length, profTagIds.length)) * 100
        );

        return {
          ...prof,
          tags: prof.tags.map((ut) => ut.tag),
          matchScore,
          commonTagCount: commonTags.length,
        };
      });

      // Skora göre sırala
      scored.sort((a, b) => b.matchScore - a.matchScore);

      const total = scored.length;
      const start = (page - 1) * limit;
      const paginated = scored.slice(start, start + limit);

      return {
        success: true,
        data: paginated,
        meta: paginationMeta(total, page, limit),
      };
    }
  );

  // GET /api/discover/projects — öğrenci tag'lerine göre önerilen projeler
  fastify.get(
    "/api/discover/projects",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Keşfet"],
        summary: "Önerilen projeler",
        description: "Öğrencinin tag'lerine göre eşleşme skoru hesaplanmış açık proje listesi",
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
              data: { type: "array", items: { $ref: "Project#" } },
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

      const userTags = await prisma.userTag.findMany({
        where: { userId: request.user!.id },
        select: { tagId: true },
      });
      const userTagIds = userTags.map((ut) => ut.tagId);

      if (userTagIds.length === 0) {
        return {
          success: true,
          data: [],
          meta: paginationMeta(0, page, limit),
          message: "Öneri almak için profilinize tag ekleyin",
        };
      }

      const projects = await prisma.project.findMany({
        where: {
          status: "OPEN",
          tags: { some: { tagId: { in: userTagIds } } },
        },
        include: {
          tags: { include: { tag: true } },
          owner: {
            select: { id: true, name: true, department: true, avatarUrl: true },
          },
          _count: { select: { applications: true } },
        },
      });

      const scored = projects.map((project) => {
        const projectTagIds = project.tags.map((pt) => pt.tagId);
        const commonTags = projectTagIds.filter((id) => userTagIds.includes(id));
        const matchScore = Math.round(
          (commonTags.length / Math.max(userTagIds.length, projectTagIds.length)) * 100
        );

        return {
          ...project,
          tags: project.tags.map((pt) => pt.tag),
          matchScore,
          commonTagCount: commonTags.length,
        };
      });

      scored.sort((a, b) => b.matchScore - a.matchScore);

      const total = scored.length;
      const start = (page - 1) * limit;
      const paginated = scored.slice(start, start + limit);

      return {
        success: true,
        data: paginated,
        meta: paginationMeta(total, page, limit),
      };
    }
  );

  // GET /api/discover/students — hoca tag'lerine göre önerilen öğrenciler
  fastify.get(
    "/api/discover/students",
    {
      preHandler: requireRole("PROFESSOR"),
      schema: {
        tags: ["Keşfet"],
        summary: "Önerilen öğrenciler",
        description: "Akademisyenin tag'lerine göre eşleşme skoru hesaplanmış öğrenci listesi",
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
              data: { type: "array", items: { $ref: "User#" } },
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

      const userTags = await prisma.userTag.findMany({
        where: { userId: request.user!.id },
        select: { tagId: true },
      });
      const userTagIds = userTags.map((ut) => ut.tagId);

      if (userTagIds.length === 0) {
        return {
          success: true,
          data: [],
          meta: paginationMeta(0, page, limit),
          message: "Öneri almak için profilinize tag ekleyin",
        };
      }

      const students = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          tags: { some: { tagId: { in: userTagIds } } },
        },
        include: {
          tags: { include: { tag: true } },
        },
      });

      const scored = students.map((student) => {
        const studentTagIds = student.tags.map((ut) => ut.tagId);
        const commonTags = studentTagIds.filter((id) => userTagIds.includes(id));
        const matchScore = Math.round(
          (commonTags.length / Math.max(userTagIds.length, studentTagIds.length)) * 100
        );

        return {
          ...student,
          tags: student.tags.map((ut) => ut.tag),
          matchScore,
          commonTagCount: commonTags.length,
        };
      });

      scored.sort((a, b) => b.matchScore - a.matchScore);

      const total = scored.length;
      const start = (page - 1) * limit;
      const paginated = scored.slice(start, start + limit);

      return {
        success: true,
        data: paginated,
        meta: paginationMeta(total, page, limit),
      };
    }
  );
};

export default discoverRoutes;
