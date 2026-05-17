import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const invitationRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/projects/:id/invite — proje sahibi davet gönderir
  fastify.post(
    "/api/projects/:id/invite",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Davetler"],
        summary: "Projeye davet gönder",
        description: "Proje sahibi başka bir kullanıcıyı projeye davet eder.",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
            message: { type: "string", nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      const { id: projectId } = request.params as { id: string };
      const { userId, message } = request.body as {
        userId: string;
        message?: string;
      };

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { userId: true, role: true } } },
      });
      if (!project) {
        return reply.status(404).send({ success: false, error: "Proje bulunamadı" });
      }
      if (project.ownerId !== request.user!.id) {
        return reply.status(403).send({
          success: false,
          error: "Sadece proje sahibi davet gönderebilir",
        });
      }
      if (userId === request.user!.id) {
        return reply.status(400).send({
          success: false,
          error: "Kendinizi davet edemezsiniz",
        });
      }

      const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, name: true },
      });
      if (!target) {
        return reply.status(404).send({ success: false, error: "Kullanıcı bulunamadı" });
      }

      // Hâlihazırda üye mi
      if (project.members.some((m) => m.userId === userId)) {
        return reply.status(409).send({
          success: false,
          error: "Bu kullanıcı zaten proje üyesi",
        });
      }

      // Kontenjan kontrolü
      const role = target.role;
      const currentCount = project.members.filter((m) => m.role === role).length;
      const capacity =
        role === "STUDENT" ? project.studentSlots : project.professorSlots;
      if (currentCount >= capacity) {
        return reply.status(400).send({
          success: false,
          error: `${role === "STUDENT" ? "Öğrenci" : "Hoca"} kontenjanı dolu`,
        });
      }

      // Mevcut bir davet varsa: PENDING ise reddet, REJECTED ise yeniden gönder
      const existing = await prisma.projectInvite.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

      let invite;
      if (existing) {
        if (existing.status === "PENDING") {
          return reply.status(409).send({
            success: false,
            error: "Bu kullanıcıya zaten bekleyen bir davet var",
          });
        }
        if (existing.status === "ACCEPTED") {
          return reply.status(409).send({
            success: false,
            error: "Bu kullanıcı daveti zaten kabul etmiş",
          });
        }
        // REJECTED: yeniden gönder
        invite = await prisma.projectInvite.update({
          where: { id: existing.id },
          data: {
            status: "PENDING",
            message: message ?? null,
            inviterId: request.user!.id,
            invitedRole: role,
          },
          include: {
            project: { select: { id: true, title: true } },
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        });
      } else {
        invite = await prisma.projectInvite.create({
          data: {
            projectId,
            userId,
            inviterId: request.user!.id,
            invitedRole: role,
            message: message ?? null,
          },
          include: {
            project: { select: { id: true, title: true } },
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        });
      }

      return { success: true, data: invite };
    }
  );

  // GET /api/invitations — bana gelen davetler
  fastify.get(
    "/api/invitations",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Davetler"],
        summary: "Gelen davetlerim",
        security: [{ cookieAuth: [] }],
      },
    },
    async (request) => {
      const userId = request.user!.id;
      const invites = await prisma.projectInvite.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              tags: { include: { tag: true } },
            },
          },
          inviter: {
            select: { id: true, name: true, department: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return {
        success: true,
        data: invites.map((i) => ({
          ...i,
          project: {
            ...i.project,
            tags: i.project.tags.map((pt) => pt.tag),
          },
        })),
      };
    }
  );

  // GET /api/projects/:id/invitations — projenin davetleri (sadece owner)
  fastify.get(
    "/api/projects/:id/invitations",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Davetler"],
        summary: "Proje davetleri",
        description: "Proje sahibi kendi gönderdiği davetleri listeler",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        return reply.status(404).send({ success: false, error: "Proje bulunamadı" });
      }
      if (project.ownerId !== request.user!.id) {
        return reply.status(403).send({ success: false, error: "Yetkiniz yok" });
      }
      const invites = await prisma.projectInvite.findMany({
        where: { projectId: id },
        include: {
          user: {
            select: { id: true, name: true, department: true, role: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return { success: true, data: invites };
    }
  );

  // PUT /api/invitations/:id — daveti kabul / reddet
  fastify.put(
    "/api/invitations/:id",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Davetler"],
        summary: "Daveti yanıtla",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ACCEPTED", "REJECTED"] },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: "ACCEPTED" | "REJECTED" };

      const invite = await prisma.projectInvite.findUnique({
        where: { id },
        include: {
          project: {
            include: { members: { select: { userId: true, role: true } } },
          },
        },
      });
      if (!invite) {
        return reply.status(404).send({ success: false, error: "Davet bulunamadı" });
      }
      if (invite.userId !== request.user!.id) {
        return reply.status(403).send({
          success: false,
          error: "Bu davet size ait değil",
        });
      }
      if (invite.status !== "PENDING") {
        return reply.status(400).send({
          success: false,
          error: "Bu davet zaten yanıtlanmış",
        });
      }

      if (status === "REJECTED") {
        const updated = await prisma.projectInvite.update({
          where: { id },
          data: { status: "REJECTED" },
        });
        return { success: true, data: updated };
      }

      // ACCEPTED: kontenjan kontrol + ProjectMember insert
      const role = invite.invitedRole;
      const currentCount = invite.project.members.filter(
        (m) => m.role === role
      ).length;
      const capacity =
        role === "STUDENT"
          ? invite.project.studentSlots
          : invite.project.professorSlots;
      if (currentCount >= capacity) {
        return reply.status(400).send({
          success: false,
          error: `${role === "STUDENT" ? "Öğrenci" : "Hoca"} kontenjanı dolu`,
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const inv = await tx.projectInvite.update({
          where: { id },
          data: { status: "ACCEPTED" },
        });
        await tx.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: invite.projectId,
              userId: invite.userId,
            },
          },
          create: {
            projectId: invite.projectId,
            userId: invite.userId,
            role,
          },
          update: {},
        });
        return inv;
      });

      return { success: true, data: updated };
    }
  );

  // GET /api/users/search — davet için kullanıcı arama
  fastify.get(
    "/api/users/search",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Kullanıcılar"],
        summary: "Kullanıcı arama (davet için)",
        security: [{ cookieAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            q: { type: "string", minLength: 1 },
            role: { type: "string", enum: ["STUDENT", "PROFESSOR"] },
            limit: { type: "integer", default: 10, minimum: 1, maximum: 30 },
          },
        },
      },
    },
    async (request) => {
      const { q, role, limit } = request.query as {
        q?: string;
        role?: "STUDENT" | "PROFESSOR";
        limit?: number;
      };
      const where: any = {
        id: { not: request.user!.id },
        ...(role ? { role } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { department: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      };
      const users = await prisma.user.findMany({
        where,
        take: limit ?? 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          avatarUrl: true,
        },
        orderBy: { name: "asc" },
      });
      return { success: true, data: users };
    }
  );
};

export default invitationRoutes;
