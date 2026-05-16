import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { updateProfileSchema, updateTagsSchema } from "@fp3/validation";

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/profile — kendi profilini getir
  fastify.get(
    "/api/profile",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Profil"],
        summary: "Kendi profilini getir",
        description: "Oturum açmış kullanıcının profil bilgilerini, tag'lerini ve istatistiklerini döner",
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "User#" },
            },
          },
          401: { $ref: "ApiError#" },
          404: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user!.id },
        include: {
          tags: { include: { tag: true } },
          _count: {
            select: {
              projects: true,
              publications: true,
              applications: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ success: false, error: "Kullanıcı bulunamadı" });
      }

      // Hocalar için "applications" sayısı, projelerine GELEN başvurular olmalı
      // (User.applications relation'ı "Applicant" tarafı — hocalar için her zaman 0)
      let applicationsCount = user._count.applications;
      if (user.role === "PROFESSOR") {
        applicationsCount = await prisma.application.count({
          where: { project: { ownerId: user.id } },
        });
      }

      return {
        success: true,
        data: {
          ...user,
          tags: user.tags.map((ut) => ut.tag),
          _count: {
            ...user._count,
            applications: applicationsCount,
          },
        },
      };
    }
  );

  // PUT /api/profile — profil güncelle
  fastify.put(
    "/api/profile",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Profil"],
        summary: "Profil güncelle",
        description: "Kullanıcının adını, bölümünü ve biyografisini günceller",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 2 },
            department: { type: "string", nullable: true },
            bio: { type: "string", nullable: true },
            year: { type: "integer", minimum: 1, maximum: 6, nullable: true },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "User#" },
            },
          },
          400: { $ref: "ApiError#" },
          401: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      const user = await prisma.user.update({
        where: { id: request.user!.id },
        data: parsed.data,
        include: {
          tags: { include: { tag: true } },
        },
      });

      return {
        success: true,
        data: {
          ...user,
          tags: user.tags.map((ut) => ut.tag),
        },
      };
    }
  );

  // GET /api/profile/:id — başka kullanıcının public profili
  fastify.get("/api/profile/:id", {
    schema: {
      tags: ["Profil"],
      summary: "Kullanıcı public profili",
      description: "Belirtilen kullanıcının herkese açık profil bilgilerini döner",
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "Kullanıcı ID" },
        },
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        tags: { include: { tag: true } },
        _count: {
          select: {
            projects: true,
            publications: true,
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({ success: false, error: "Kullanıcı bulunamadı" });
    }

    return {
      success: true,
      data: {
        ...user,
        tags: user.tags.map((ut) => ut.tag),
      },
    };
  });

  // PUT /api/profile/tags — tag'leri güncelle
  fastify.put(
    "/api/profile/tags",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Profil"],
        summary: "Profil tag'lerini güncelle",
        description: "Kullanıcının ilgi alanı tag'lerini toplu olarak günceller. Mevcut tag'ler silinir, yenileri eklenir",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["tagIds"],
          properties: {
            tagIds: {
              type: "array",
              items: { type: "string" },
              description: "Atanacak tag ID listesi",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  tags: { type: "array", items: { $ref: "Tag#" } },
                },
              },
            },
          },
          400: { $ref: "ApiError#" },
          401: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const parsed = updateTagsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors[0].message,
        });
      }

      const { tagIds } = parsed.data;

      // Mevcut tag'leri sil, yenilerini ekle
      await prisma.$transaction([
        prisma.userTag.deleteMany({ where: { userId: request.user!.id } }),
        ...tagIds.map((tagId) =>
          prisma.userTag.create({
            data: { userId: request.user!.id, tagId },
          })
        ),
      ]);

      const user = await prisma.user.findUnique({
        where: { id: request.user!.id },
        include: { tags: { include: { tag: true } } },
      });

      return {
        success: true,
        data: {
          tags: user!.tags.map((ut) => ut.tag),
        },
      };
    }
  );
};

export default profileRoutes;
