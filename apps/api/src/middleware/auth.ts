import { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

/**
 * Oturumdan kullanıcı bilgisini çeker
 */
export async function getSession(request: FastifyRequest) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
  return session;
}

/**
 * Auth zorunlu middleware - oturum yoksa 401
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const session = await getSession(request);

  if (!session) {
    return reply.status(401).send({
      success: false,
      error: "Oturum açmanız gerekiyor",
    });
  }

  request.session = session.session as any;
  request.user = session.user as any;
}

/**
 * Rol bazlı yetkilendirme middleware'i
 */
export function requireRole(role: "STUDENT" | "PROFESSOR") {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const session = await getSession(request);

    if (!session) {
      return reply.status(401).send({
        success: false,
        error: "Oturum açmanız gerekiyor",
      });
    }

    request.session = session.session as any;
    request.user = session.user as any;

    if ((session.user as any).role !== role) {
      return reply.status(403).send({
        success: false,
        error: `Bu işlem için ${role === "PROFESSOR" ? "akademisyen" : "öğrenci"} rolü gerekiyor`,
      });
    }
  };
}
