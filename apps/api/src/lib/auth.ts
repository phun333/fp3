import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
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

  trustedOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],

  advanced: {
    cookiePrefix: "fp3",
  },
});

export type Auth = typeof auth;
