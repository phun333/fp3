import type { FastifyInstance } from "fastify";

/**
 * Paylaşımlı JSON şemalarını Fastify'a kaydeder.
 * Bu şemalar Swagger dokümantasyonu ve response serialization için kullanılır.
 */
export function registerSharedSchemas(app: FastifyInstance) {
  // Standart hata response şeması
  app.addSchema({
    $id: "ApiError",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string" },
    },
  });

  // Pagination meta şeması
  app.addSchema({
    $id: "PaginationMeta",
    type: "object",
    properties: {
      page: { type: "number" },
      limit: { type: "number" },
      total: { type: "number" },
      totalPages: { type: "number" },
    },
  });

  // Tag şeması
  app.addSchema({
    $id: "Tag",
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      category: { type: "string", nullable: true },
    },
  });

  // User şeması
  app.addSchema({
    $id: "User",
    type: "object",
    properties: {
      id: { type: "string" },
      email: { type: "string" },
      name: { type: "string" },
      role: { type: "string", enum: ["STUDENT", "PROFESSOR"] },
      department: { type: "string" },
      year: { type: "integer", nullable: true },
      bio: { type: "string", nullable: true },
      avatarUrl: { type: "string", nullable: true },
      emailVerified: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      tags: {
        type: "array",
        items: { $ref: "Tag#" },
        nullable: true,
      },
    },
  });

  // Project şeması
  app.addSchema({
    $id: "Project",
    type: "object",
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "CLOSED"] },
      maxMembers: { type: "number" },
      ownerId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      owner: { $ref: "User#" },
      tags: {
        type: "array",
        items: { $ref: "Tag#" },
        nullable: true,
      },
    },
  });

  // Publication şeması
  app.addSchema({
    $id: "Publication",
    type: "object",
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      abstract: { type: "string", nullable: true },
      url: { type: "string", nullable: true },
      year: { type: "number", nullable: true },
      authorId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      author: { $ref: "User#" },
      tags: {
        type: "array",
        items: { $ref: "Tag#" },
        nullable: true,
      },
    },
  });

  // Application şeması
  app.addSchema({
    $id: "Application",
    type: "object",
    properties: {
      id: { type: "string" },
      status: { type: "string", enum: ["PENDING", "ACCEPTED", "REJECTED"] },
      message: { type: "string", nullable: true },
      projectId: { type: "string" },
      applicantId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      project: { $ref: "Project#" },
      applicant: { $ref: "User#" },
    },
  });
}
