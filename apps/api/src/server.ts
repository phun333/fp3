import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { setupSwagger } from "./lib/swagger";
import { registerSharedSchemas } from "./lib/schemas";

// Routes
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import professorRoutes from "./routes/professors";
import studentRoutes from "./routes/students";
import projectRoutes from "./routes/projects";
import publicationRoutes from "./routes/publications";
import applicationRoutes from "./routes/applications";
import tagRoutes from "./routes/tags";
import discoverRoutes from "./routes/discover";
import aiRoutes from "./routes/ai";
import matchingRoutes from "./routes/matching";
import savedMatchRoutes from "./routes/saved-matches";
import teamIdeaRoutes from "./routes/team-ideas";

const app = Fastify({
  logger: true,
});

// CORS
app.register(cors, {
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// Cookie desteği
app.register(cookie);

// Paylaşımlı JSON şemaları (Swagger + serialization için)
registerSharedSchemas(app);

// Swagger + Scalar API Docs
app.register(setupSwagger);

// Body parser - raw body desteği (Better Auth için)
app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (req, body, done) => {
    try {
      const json = JSON.parse(body as string);
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);

// Health check
app.get("/health", {
  schema: {
    tags: ["Sistem"],
    summary: "Sağlık kontrolü",
    description: "API sunucusunun çalışıp çalışmadığını kontrol eder",
    response: {
      200: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
}, async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Route'ları kaydet
app.register(authRoutes);
app.register(profileRoutes);
app.register(professorRoutes);
app.register(studentRoutes);
app.register(projectRoutes);
app.register(publicationRoutes);
app.register(applicationRoutes);
app.register(tagRoutes);
app.register(discoverRoutes);
app.register(aiRoutes);
app.register(matchingRoutes);
app.register(savedMatchRoutes);
app.register(teamIdeaRoutes);

// Global error handler
app.setErrorHandler((error: any, request, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    success: false,
    error: statusCode === 500 ? "Sunucu hatası" : error.message,
  });
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 FP3 API running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
