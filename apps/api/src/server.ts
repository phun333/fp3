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
import invitationRoutes from "./routes/invitations";
import professorApplicationRoutes from "./routes/professor-applications";

const app = Fastify({
  logger: true,
});

// Mobil istemciler (özellikle iOS NSURLSession) Set-Cookie'leri otomatik
// yakalayıp Cookie header'a HTTP standart `;` yerine `,` ile ekleyebiliyor.
// Bu bozuk cookie Better Auth'u şaşırtıyor. Authorization (Bearer) geldiğinde
// Cookie header'ını yok sayıp sadece Bearer token üzerinden session açıyoruz.
app.addHook("onRequest", async (req) => {
  const auth = req.headers["authorization"] as string | undefined;
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    delete req.headers.cookie;
  } else {
    // Bearer yoksa, Cookie header'ında virgüle bağlı çoklu cookie varsa
    // bunları HTTP standart `;` ile normalize et.
    const cookie = req.headers.cookie as string | undefined;
    if (cookie && cookie.includes(",")) {
      req.headers.cookie = cookie.replace(/,(?=\s*[A-Za-z0-9_.-]+=)/g, "; ");
    }
  }
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
// Boş body'yi de tolere et (DELETE / body'siz POST için)
app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (req, body, done) => {
    const raw = (body as string) ?? "";
    if (raw.length === 0) {
      done(null, undefined);
      return;
    }
    try {
      const json = JSON.parse(raw);
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
app.register(invitationRoutes);
app.register(professorApplicationRoutes);

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
    const port = Number(process.env.PORT) || 3001;
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 FP3 API running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
