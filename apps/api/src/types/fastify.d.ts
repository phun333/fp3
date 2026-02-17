import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string;
      role: "STUDENT" | "PROFESSOR";
      department: string;
      bio?: string | null;
      avatarUrl?: string | null;
      emailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    session?: {
      id: string;
      userId: string;
      token: string;
      expiresAt: Date;
      createdAt: Date;
      updatedAt: Date;
      ipAddress?: string | null;
      userAgent?: string | null;
    };
  }
}
