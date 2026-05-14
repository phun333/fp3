import { z } from "zod";

// ===== Auth Schemas =====
export const loginSchema = z.object({
  email: z
    .string()
    .email("Geçerli bir email adresi giriniz")
    .refine((email) => email.endsWith("@ostimteknik.edu.tr"), {
      message: "Sadece @ostimteknik.edu.tr uzantılı mailler kabul edilir",
    }),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
});

export const signupSchema = z.object({
  email: z
    .string()
    .email("Geçerli bir email adresi giriniz")
    .refine((email) => email.endsWith("@ostimteknik.edu.tr"), {
      message: "Sadece @ostimteknik.edu.tr uzantılı mailler kabul edilir",
    }),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır").max(100),
  role: z.enum(["STUDENT", "PROFESSOR"]),
  department: z.string().min(2, "Bölüm adı en az 2 karakter olmalıdır"),
});

// ===== Profile Schemas =====
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(1000).optional(),
  department: z.string().min(2).optional(),
  year: z.number().int().min(1).max(6).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const updateTagsSchema = z.object({
  tagIds: z.array(z.string()).min(1, "En az 1 tag seçmelisiniz").max(10, "En fazla 10 tag seçebilirsiniz"),
});

// ===== Project Schemas =====
export const createProjectSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır").max(200),
  description: z.string().min(20, "Açıklama en az 20 karakter olmalıdır").max(5000),
  maxMembers: z.number().int().min(1).max(20).default(3),
  tagIds: z.array(z.string()).min(1).max(10),
});

export const updateProjectSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  maxMembers: z.number().int().min(1).max(20).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
  tagIds: z.array(z.string()).min(1).max(10).optional(),
});

// ===== Publication Schemas =====
export const createPublicationSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır").max(500),
  abstract: z.string().max(5000).optional(),
  url: z.string().url("Geçerli bir URL giriniz").optional(),
  year: z.number().int().min(1990).max(2030).optional(),
  tagIds: z.array(z.string()).min(1).max(10),
});

export const updatePublicationSchema = z.object({
  title: z.string().min(5).max(500).optional(),
  abstract: z.string().max(5000).optional(),
  url: z.string().url().optional().nullable(),
  year: z.number().int().min(1990).max(2030).optional(),
  tagIds: z.array(z.string()).min(1).max(10).optional(),
});

// ===== Application Schemas =====
export const createApplicationSchema = z.object({
  message: z.string().max(1000).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

// ===== Query Schemas =====
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const searchSchema = paginationSchema.extend({
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated tag IDs
});

export const projectSearchSchema = searchSchema.extend({
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
});

// ===== Matching Schemas =====
export const matchPreferencesSchema = z.object({
  purpose: z.enum(["ARTICLE", "PROJECT"]),
  description: z.string().max(2000).optional(),
  tagIds: z.array(z.string()).optional(), // override user tags
  year: z.coerce.number().int().min(1).max(6).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type MatchPreferencesInput = z.infer<typeof matchPreferencesSchema>;

export const teamMatchSchema = z.object({
  title: z.string().min(5, "Fikir başlığı en az 5 karakter olmalıdır").max(200),
  description: z.string().min(20, "Fikir açıklaması en az 20 karakter olmalıdır").max(5000),
  professorSlots: z.coerce.number().int().min(1).max(10).default(2),
  studentSlots: z.coerce.number().int().min(1).max(50).default(10),
  tagIds: z.array(z.string()).min(1, "En az 1 tag seçmelisiniz").max(10),
  selectedProfessorIds: z.array(z.string()).max(10).default([]),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createTeamIdeaSchema = teamMatchSchema.omit({ limit: true }).extend({
  professorInvites: z.array(z.object({
    userId: z.string().min(1),
    handoffNote: z.string().max(1000).optional(),
    matchScore: z.number().int().min(0).max(100).default(0),
  })).max(10).default([]),
  studentInvites: z.array(z.object({
    userId: z.string().min(1),
    handoffNote: z.string().max(1000).optional(),
    matchScore: z.number().int().min(0).max(100).default(0),
  })).max(50).default([]),
});

// ===== Saved Match Schemas =====
export const saveMatchSchema = z.object({
  professorId: z.string().min(1, "Akademisyen ID gerekli"),
  purpose: z.enum(["ARTICLE", "PROJECT"]),
  description: z.string().max(2000).optional(),
  matchScore: z.number().int().min(0).max(100).default(0),
});

export const unsaveMatchSchema = z.object({
  professorId: z.string().min(1, "Akademisyen ID gerekli"),
  purpose: z.enum(["ARTICLE", "PROJECT"]),
});

export type SaveMatchInput = z.infer<typeof saveMatchSchema>;
export type UnsaveMatchInput = z.infer<typeof unsaveMatchSchema>;

// ===== AI Schemas =====
export const aiExtractTagsSchema = z.object({
  text: z.string().min(10, "Metin en az 10 karakter olmalıdır").max(10000),
  top_n: z.number().int().min(1).max(20).default(5),
});

export const aiAnalyzeProfileSchema = z.object({
  bio: z.string().min(10).max(5000),
  publications: z.array(z.string()).optional(),
});

// ===== Type Exports =====
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateTagsInput = z.infer<typeof updateTagsSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreatePublicationInput = z.infer<typeof createPublicationSchema>;
export type UpdatePublicationInput = z.infer<typeof updatePublicationSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ProjectSearchInput = z.infer<typeof projectSearchSchema>;
export type TeamMatchInput = z.infer<typeof teamMatchSchema>;
export type CreateTeamIdeaInput = z.infer<typeof createTeamIdeaSchema>;
export type AIExtractTagsInput = z.infer<typeof aiExtractTagsSchema>;
export type AIAnalyzeProfileInput = z.infer<typeof aiAnalyzeProfileSchema>;
