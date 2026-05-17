import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Dev ortamda false, prod'da true yapılacak
    signUp: {
      async beforeCreate({ email, ...rest }: { email: string; [key: string]: any }) {
        if (!email.endsWith("@ostimteknik.edu.tr")) {
          throw new Error("Sadece @ostimteknik.edu.tr uzantılı e-posta adresleri kabul edilir");
        }
        return { email, ...rest };
      },
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: true,
      },
      department: {
        type: "string",
        required: true,
        input: true,
      },
      bio: {
        type: "string",
        required: false,
        input: true,
      },
      avatarUrl: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 gün
    updateAge: 60 * 60 * 24, // 1 gün
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Dev ortamda console'a log'la
      console.log("📧 Email doğrulama:");
      console.log(`   Kullanıcı: ${user.email}`);
      console.log(`   Doğrulama linki: ${url}`);
    },
    sendOnSignUp: true,
  },

  trustedOrigins: (request?: Request) => {
    const envOrigins = (process.env.CORS_ORIGINS?.split(",") ?? [])
      .map((s) => s.trim())
      .filter(Boolean);
    const reqOrigin = request?.headers.get("origin") ?? null;
    // Geliştirme sırasında mobil cihazlardan (LAN IP) gelen istekleri kabul et
    const lanPattern =
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+)(:\d+)?$/;
    const isLanOrigin = !!reqOrigin && lanPattern.test(reqOrigin);
    return [
      ...envOrigins,
      ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
      // Expo / native app scheme'leri
      "exp://",
      "fp3://",
      ...(isLanOrigin && reqOrigin ? [reqOrigin] : []),
    ];
  },

  advanced: {
    cookiePrefix: "fp3",
  },

  // Mobil (React Native / Expo) için Bearer token desteği:
  // Cookie yerine Authorization: Bearer <session_token> header'ı kullanılabilir.
  plugins: [bearer()],
});

export type Auth = typeof auth;
