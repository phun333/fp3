import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";

const tagRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/tags — tüm tag'leri listele (kategori bazlı gruplanmış)
  fastify.get("/api/tags", {
    schema: {
      tags: ["Etiketler"],
      summary: "Tüm etiketleri listele",
      description: "Tüm tag'leri kategori bazlı gruplanmış olarak döner. Kullanım sayılarını içerir",
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                tags: { type: "array", items: { $ref: "Tag#" } },
                grouped: { type: "object", additionalProperties: { type: "array", items: { $ref: "Tag#" } } },
              },
            },
          },
        },
      },
    },
  }, async () => {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
            publications: true,
          },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Kategori bazlı gruplama
    const grouped: Record<string, typeof tags> = {};
    for (const tag of tags) {
      const category = tag.category || "Diğer";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(tag);
    }

    return {
      success: true,
      data: {
        tags,
        grouped,
      },
    };
  });

  // GET /api/tags/:id — tag detayı + ilgili hocalar ve projeler
  fastify.get("/api/tags/:id", {
    schema: {
      tags: ["Etiketler"],
      summary: "Etiket detayı",
      description: "Etiketin detayını, ilişkili akademisyenleri, öğrencileri ve projeleri döner",
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
            data: { $ref: "Tag#" },
          },
        },
        404: { $ref: "ApiError#" },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                department: true,
                avatarUrl: true,
              },
            },
          },
        },
        projects: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                status: true,
                owner: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!tag) {
      return reply.status(404).send({ success: false, error: "Tag bulunamadı" });
    }

    return {
      success: true,
      data: {
        ...tag,
        professors: tag.users
          .filter((ut) => ut.user.role === "PROFESSOR")
          .map((ut) => ut.user),
        students: tag.users
          .filter((ut) => ut.user.role === "STUDENT")
          .map((ut) => ut.user),
        projects: tag.projects.map((pt) => pt.project),
      },
    };
  });
};

export default tagRoutes;
