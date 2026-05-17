import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireRole } from "../middleware/auth";
import { matchPreferencesSchema } from "@fp3/validation";

const matchingRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/match/professors — gelişmiş hoca eşleştirme
  fastify.post(
    "/api/match/professors",
    {
      preHandler: requireRole("STUDENT"),
      schema: {
        tags: ["Eşleştirme"],
        summary: "Hoca eşleştirme",
        description:
          "Öğrencinin tercihlerine (amaç, tag'ler, açıklama) göre en uygun akademisyenleri sıralı döner. Makale amacı yayın sayısını, proje amacı proje sayısını bonus olarak hesaplar.",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["purpose"],
          properties: {
            purpose: {
              type: "string",
              enum: ["ARTICLE", "PROJECT"],
              description: "Makale veya proje amacı",
            },
            description: {
              type: "string",
              maxLength: 2000,
              description: "Ne yapmak istediğinin açıklaması",
            },
            tagIds: {
              type: "array",
              items: { type: "string" },
              description: "Eşleştirme için kullanılacak tag ID'leri (boş ise profil tag'leri kullanılır)",
            },
            year: {
              type: "integer",
              minimum: 1,
              maximum: 6,
              description: "Öğrencinin sınıfı",
            },
            limit: {
              type: "integer",
              default: 20,
              minimum: 1,
              maximum: 50,
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              studentTagIds: { type: "array", items: { type: "string" } },
            },
          },
          400: { $ref: "ApiError#" },
        },
      },
    },
    async (request, reply) => {
      const parsed = matchPreferencesSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ success: false, error: parsed.error.errors[0].message });
      }

      const { purpose, description, tagIds: overrideTagIds, limit } = parsed.data;

      // Öğrencinin tag'lerini al (override varsa onu kullan)
      let studentTagIds: string[];
      if (overrideTagIds && overrideTagIds.length > 0) {
        studentTagIds = overrideTagIds;
      } else {
        const userTags = await prisma.userTag.findMany({
          where: { userId: request.user!.id },
          select: { tagId: true },
        });
        studentTagIds = userTags.map((ut) => ut.tagId);
      }

      if (studentTagIds.length === 0) {
        return {
          success: true,
          data: [],
          studentTagIds: [],
          message: "Eşleştirme için en az 1 ilgi alanı seçmelisiniz",
        };
      }

      // Tüm hocaları tag'leri, projeleri ve yayınlarıyla getir
      const professors = await prisma.user.findMany({
        where: {
          role: "PROFESSOR",
          tags: { some: { tagId: { in: studentTagIds } } },
        },
        include: {
          tags: { include: { tag: true } },
          _count: { select: { projects: true, publications: true } },
          projects: {
            where: { status: "OPEN" },
            include: { tags: { include: { tag: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          publications: {
            include: { tags: { include: { tag: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      // Gelişmiş eşleşme skoru hesapla
      const scored = professors.map((prof) => {
        const profTagIds = prof.tags.map((ut) => ut.tagId);
        const commonTags = profTagIds.filter((id) => studentTagIds.includes(id));
        const commonTagDetails = prof.tags
          .filter((ut) => studentTagIds.includes(ut.tagId))
          .map((ut) => ut.tag);

        // Temel skor: öğrencinin istediği tag'lerin yüzde kaçı hocada var
        // (3/3 ortak ise %100; hocanın ekstra tag'leri skoru DÜŞÜRMEZ)
        const coverage =
          studentTagIds.length === 0
            ? 0
            : (commonTags.length / studentTagIds.length) * 100;
        const tagScore = coverage;

        // Açık proje / yayın varsa küçük bonus puanlar (toplam 100 cap'i ile)
        let purposeBonus = 0;
        if (purpose === "PROJECT") {
          const openProjectCount = prof.projects.length;
          const projectTagOverlap = prof.projects.some((p) =>
            p.tags.some((pt) => studentTagIds.includes(pt.tagId))
          );
          purposeBonus =
            Math.min(openProjectCount * 5, 15) + (projectTagOverlap ? 10 : 0);
        } else {
          const pubCount = prof.publications.length;
          const pubTagOverlap = prof.publications.some((pub) =>
            pub.tags.some((pt) => studentTagIds.includes(pt.tagId))
          );
          purposeBonus =
            Math.min(pubCount * 3, 15) + (pubTagOverlap ? 10 : 0);
        }

        // Tüm tag'ler birebir karşılanıyorsa %100'ün altına inmesin
        const matchScore = Math.min(
          100,
          Math.round(tagScore + purposeBonus)
        );

        const purposeScore = purposeBonus;
        const activityScore = Math.min(
          (prof._count.projects + prof._count.publications) * 15,
          100
        );

        return {
          id: prof.id,
          name: prof.name,
          email: prof.email,
          department: prof.department,
          bio: prof.bio,
          avatarUrl: prof.avatarUrl,
          role: prof.role,
          tags: prof.tags.map((ut) => ut.tag),
          commonTags: commonTagDetails,
          commonTagCount: commonTags.length,
          matchScore,
          tagScore: Math.round(tagScore),
          purposeScore: Math.round(purposeScore),
          _count: prof._count,
          // Amaca uygun içerikler
          relevantProjects:
            purpose === "PROJECT"
              ? prof.projects.map((p) => ({
                  id: p.id,
                  title: p.title,
                  description: p.description,
                  status: p.status,
                  tags: p.tags.map((pt) => pt.tag),
                }))
              : [],
          relevantPublications:
            purpose === "ARTICLE"
              ? prof.publications.map((pub) => ({
                  id: pub.id,
                  title: pub.title,
                  abstract: pub.abstract,
                  year: pub.year,
                  tags: pub.tags.map((pt) => pt.tag),
                }))
              : [],
        };
      });

      // Skora göre sırala
      scored.sort((a, b) => b.matchScore - a.matchScore);

      return {
        success: true,
        data: scored.slice(0, limit),
        studentTagIds,
      };
    }
  );
};

export default matchingRoutes;
