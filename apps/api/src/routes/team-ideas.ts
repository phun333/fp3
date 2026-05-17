import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireRole } from "../middleware/auth";
import { createTeamIdeaSchema, teamMatchSchema } from "@fp3/validation";

type ScoredUser = {
  id: string;
  name: string;
  email: string;
  department: string;
  bio: string | null;
  avatarUrl: string | null;
  role: "STUDENT" | "PROFESSOR";
  year?: number | null;
  tags: { id: string; name: string; category: string | null }[];
  commonTags: { id: string; name: string; category: string | null }[];
  commonTagCount: number;
  matchScore: number;
  tagScore: number;
  activityScore?: number;
  departmentScore?: number;
  _count?: { projects?: number; publications?: number; applications?: number };
};

function scoreUser(user: any, targetTagIds: string[], ownerDepartment: string): ScoredUser {
  const userTagIds = user.tags.map((ut: any) => ut.tagId);
  const commonTags = user.tags
    .filter((ut: any) => targetTagIds.includes(ut.tagId))
    .map((ut: any) => ut.tag);

  const tagScore = Math.round(
    (commonTags.length / Math.max(targetTagIds.length, userTagIds.length, 1)) * 100
  );
  const activityScore = Math.min(
    ((user._count?.projects || 0) + (user._count?.publications || 0)) * 15,
    100
  );
  const departmentScore = user.department === ownerDepartment ? 100 : 40;
  const matchScore = Math.round(tagScore * 0.7 + activityScore * 0.2 + departmentScore * 0.1);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    year: user.year,
    tags: user.tags.map((ut: any) => ut.tag),
    commonTags,
    commonTagCount: commonTags.length,
    matchScore,
    tagScore,
    activityScore,
    departmentScore,
    _count: user._count,
  };
}

const teamIdeaRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/match/team — akademisyen için karma ekip önerisi
  fastify.post(
    "/api/match/team",
    {
      preHandler: requireRole("PROFESSOR"),
      schema: {
        tags: ["Ekip Kurma"],
        summary: "Akademisyen + öğrenci ekip eşleştirme",
        description:
          "Akademisyenin proje fikri, ihtiyaç duyduğu akademisyen/öğrenci sayısı ve tag'lerine göre ekip önerileri üretir.",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          required: ["title", "description", "professorSlots", "studentSlots", "tagIds"],
          properties: {
            title: { type: "string", minLength: 5, maxLength: 200 },
            description: { type: "string", minLength: 20, maxLength: 5000 },
            professorSlots: { type: "integer", minimum: 1, maximum: 10 },
            studentSlots: { type: "integer", minimum: 1, maximum: 50 },
            tagIds: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 10 },
            selectedProfessorIds: { type: "array", items: { type: "string" }, maxItems: 10 },
            limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = teamMatchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
      }

      const { tagIds, selectedProfessorIds, limit, professorSlots, studentSlots } = parsed.data;
      const owner = request.user!;
      const selectedSet = new Set(selectedProfessorIds);

      const [selectedProfessorsRaw, recommendedProfessorsRaw, recommendedStudentsRaw] = await Promise.all([
        selectedProfessorIds.length
          ? prisma.user.findMany({
              where: { id: { in: selectedProfessorIds }, role: "PROFESSOR", NOT: { id: owner.id } },
              include: {
                tags: { include: { tag: true } },
                _count: { select: { projects: true, publications: true } },
              },
            })
          : Promise.resolve([]),
        prisma.user.findMany({
          where: {
            role: "PROFESSOR",
            NOT: [{ id: owner.id }, { id: { in: selectedProfessorIds } }],
            tags: { some: { tagId: { in: tagIds } } },
          },
          include: {
            tags: { include: { tag: true } },
            _count: { select: { projects: true, publications: true } },
          },
          take: limit * 2,
        }),
        prisma.user.findMany({
          where: {
            role: "STUDENT",
            tags: { some: { tagId: { in: tagIds } } },
          },
          include: {
            tags: { include: { tag: true } },
            _count: { select: { applications: true } },
          },
          take: Math.max(limit * 2, studentSlots * 2),
        }),
      ]);

      const selectedProfessors = selectedProfessorsRaw
        .map((u) => scoreUser(u, tagIds, owner.department))
        .sort((a, b) => b.matchScore - a.matchScore);
      const recommendedProfessors = recommendedProfessorsRaw
        .filter((u) => !selectedSet.has(u.id))
        .map((u) => scoreUser(u, tagIds, owner.department))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
      const recommendedStudents = recommendedStudentsRaw
        .map((u) => scoreUser(u, tagIds, owner.department))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, Math.max(limit, studentSlots));

      return {
        success: true,
        data: {
          selectedProfessors,
          recommendedProfessors,
          recommendedStudents,
          needed: {
            professors: Math.max(professorSlots - 1 - selectedProfessors.length, 0),
            students: studentSlots,
          },
          tagIds,
        },
      };
    }
  );

  // POST /api/team-ideas — ekip kurma kaydı ve davetleri oluştur
  fastify.post(
    "/api/team-ideas",
    {
      preHandler: requireRole("PROFESSOR"),
      schema: {
        tags: ["Ekip Kurma"],
        summary: "Ekip fikri oluştur",
        security: [{ cookieAuth: [] }],
      },
    },
    async (request, reply) => {
      const parsed = createTeamIdeaSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: parsed.error.errors[0].message });
      }

      const {
        title,
        description,
        professorSlots,
        studentSlots,
        tagIds,
        professorInvites,
        studentInvites,
      } = parsed.data;

      const usersToInvite = [...professorInvites, ...studentInvites];
      const professorIds = professorInvites.map((i) => i.userId);
      const studentIds = studentInvites.map((i) => i.userId);

      const validInvitees = usersToInvite.length
        ? await prisma.user.findMany({
            where: {
              OR: [
                { id: { in: professorIds }, role: "PROFESSOR" },
                { id: { in: studentIds }, role: "STUDENT" },
              ],
              NOT: { id: request.user!.id },
            },
            select: { id: true, role: true },
          })
        : [];
      const validMap = new Map(validInvitees.map((u) => [u.id, u.role]));

      const validInvites = usersToInvite.filter((invite) =>
        validMap.has(invite.userId)
      );

      // Hem TeamIdea (planlama / analiz kaydı) hem de gerçek Project + ProjectInvite oluştur
      // Böylece proje /my-projects'te görünür, davet edilenler /incoming-applications -> Davetlerim'de görür.
      const result = await prisma.$transaction(async (tx) => {
        const teamIdea = await tx.teamIdea.create({
          data: {
            title,
            description,
            professorSlots,
            studentSlots,
            ownerId: request.user!.id,
            tags: { create: tagIds.map((tagId) => ({ tagId })) },
            invites: {
              create: validInvites.map((invite) => ({
                userId: invite.userId,
                role: validMap.get(invite.userId)!,
                handoffNote: invite.handoffNote,
                matchScore: invite.matchScore,
              })),
            },
          },
          include: {
            tags: { include: { tag: true } },
            owner: {
              select: { id: true, name: true, email: true, department: true },
            },
            invites: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    department: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        });

        const project = await tx.project.create({
          data: {
            title,
            description,
            ownerId: request.user!.id,
            studentSlots,
            professorSlots,
            tags: { create: tagIds.map((tagId) => ({ tagId })) },
            members: {
              create: { userId: request.user!.id, role: "PROFESSOR" },
            },
            invites: {
              create: validInvites.map((invite) => ({
                userId: invite.userId,
                inviterId: request.user!.id,
                invitedRole: validMap.get(invite.userId)!,
                message: invite.handoffNote ?? null,
              })),
            },
          },
          include: {
            tags: { include: { tag: true } },
            owner: {
              select: { id: true, name: true, department: true, avatarUrl: true },
            },
            members: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
            },
            invites: {
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
              orderBy: { createdAt: "asc" },
            },
          },
        });

        return { teamIdea, project };
      });

      return {
        success: true,
        data: {
          ...result.teamIdea,
          tags: result.teamIdea.tags.map((tt) => tt.tag),
          projectId: result.project.id,
          project: {
            ...result.project,
            tags: result.project.tags.map((pt) => pt.tag),
          },
        },
      };
    }
  );

  // GET /api/team-ideas/my — oluşturduğum veya davet edildiğim ekip fikirleri
  fastify.get(
    "/api/team-ideas/my",
    { preHandler: requireRole("PROFESSOR"), schema: { tags: ["Ekip Kurma"], summary: "Ekip fikirlerim" } },
    async (request) => {
      const ideas = await prisma.teamIdea.findMany({
        where: {
          OR: [{ ownerId: request.user!.id }, { invites: { some: { userId: request.user!.id } } }],
        },
        include: {
          tags: { include: { tag: true } },
          owner: { select: { id: true, name: true, email: true, department: true } },
          invites: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true, department: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        data: ideas.map((idea) => ({ ...idea, tags: idea.tags.map((tt) => tt.tag) })),
      };
    }
  );
};

export default teamIdeaRoutes;
