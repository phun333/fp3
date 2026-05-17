// API'ye dorudan bağlanıyoruz (localhost:3001). CORS + credentials: "include"
// ile cookie'ler iletilir.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export async function api<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  // Body olmadan Content-Type: application/json göndermeyelim
  // (Fastify'ın JSON parser'ı boş body'yi parse etmeye çalışıp 500 atar)
  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && body !== null) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Bir hata oluştu");
  }

  return data;
}

// Auth API
export const authApi = {
  signUp: (body: {
    email: string;
    password: string;
    name: string;
    role: string;
    department: string;
  }) => api("/api/auth/sign-up/email", { method: "POST", body }),

  signIn: (body: { email: string; password: string }) =>
    api("/api/auth/sign-in/email", { method: "POST", body }),

  signOut: () => api("/api/auth/sign-out", { method: "POST" }),

  getSession: () => api("/api/auth/get-session"),
};

// Profile API
export const profileApi = {
  getMe: () => api("/api/profile"),
  update: (body: any) => api("/api/profile", { method: "PUT", body }),
  getById: (id: string) => api(`/api/profile/${id}`),
  updateTags: (tagIds: string[]) =>
    api("/api/profile/tags", { method: "PUT", body: { tagIds } }),
};

// Professors API
export const professorsApi = {
  list: (params?: string) => api(`/api/professors${params ? `?${params}` : ""}`),
  getById: (id: string) => api(`/api/professors/${id}`),
};

// Students API
export const studentsApi = {
  list: (params?: string) => api(`/api/students${params ? `?${params}` : ""}`),
  getById: (id: string) => api(`/api/students/${id}`),
};

// Projects API
export const projectsApi = {
  list: (params?: string) => api(`/api/projects${params ? `?${params}` : ""}`),
  getById: (id: string) => api(`/api/projects/${id}`),
  create: (body: any) => api("/api/projects", { method: "POST", body }),
  update: (id: string, body: any) =>
    api(`/api/projects/${id}`, { method: "PUT", body }),
  delete: (id: string) => api(`/api/projects/${id}`, { method: "DELETE" }),
  mine: () => api("/api/my-projects"),
};

// Publications API
export const publicationsApi = {
  list: (params?: string) =>
    api(`/api/publications${params ? `?${params}` : ""}`),
  getById: (id: string) => api(`/api/publications/${id}`),
  create: (body: any) => api("/api/publications", { method: "POST", body }),
  update: (id: string, body: any) =>
    api(`/api/publications/${id}`, { method: "PUT", body }),
  delete: (id: string) =>
    api(`/api/publications/${id}`, { method: "DELETE" }),
};

// Applications API
export const applicationsApi = {
  apply: (projectId: string, body?: { message?: string }) =>
    api(`/api/projects/${projectId}/apply`, { method: "POST", body }),
  listForProject: (projectId: string, params?: string) =>
    api(`/api/projects/${projectId}/applications${params ? `?${params}` : ""}`),
  updateStatus: (id: string, status: string) =>
    api(`/api/applications/${id}`, { method: "PUT", body: { status } }),
  myApplications: (params?: string) =>
    api(`/api/my-applications${params ? `?${params}` : ""}`),
  incoming: (params?: string) =>
    api(`/api/applications/incoming${params ? `?${params}` : ""}`),
};

// Tags API
export const tagsApi = {
  list: () => api("/api/tags"),
  getById: (id: string) => api(`/api/tags/${id}`),
};

// Discover API
export const discoverApi = {
  professors: (params?: string) =>
    api(`/api/discover/professors${params ? `?${params}` : ""}`),
  projects: (params?: string) =>
    api(`/api/discover/projects${params ? `?${params}` : ""}`),
  students: (params?: string) =>
    api(`/api/discover/students${params ? `?${params}` : ""}`),
};

// Matching API
export const matchingApi = {
  matchProfessors: (body: {
    purpose: "ARTICLE" | "PROJECT";
    description?: string;
    tagIds?: string[];
    year?: number;
    limit?: number;
  }) => api("/api/match/professors", { method: "POST", body }),

  matchTeam: (body: {
    title: string;
    description: string;
    professorSlots: number;
    studentSlots: number;
    tagIds: string[];
    selectedProfessorIds?: string[];
    limit?: number;
  }) => api("/api/match/team", { method: "POST", body }),
};

// Team Formation API
export const teamIdeasApi = {
  create: (body: {
    title: string;
    description: string;
    professorSlots: number;
    studentSlots: number;
    tagIds: string[];
    selectedProfessorIds?: string[];
    professorInvites?: { userId: string; handoffNote?: string; matchScore?: number }[];
    studentInvites?: { userId: string; handoffNote?: string; matchScore?: number }[];
  }) => api("/api/team-ideas", { method: "POST", body }),
  my: () => api("/api/team-ideas/my"),
};

// Saved Matches API
export const savedMatchesApi = {
  save: (body: {
    professorId: string;
    purpose: "ARTICLE" | "PROJECT";
    description?: string;
    matchScore?: number;
  }) => api("/api/saved-matches", { method: "POST", body }),

  unsave: (body: { professorId: string; purpose: "ARTICLE" | "PROJECT" }) =>
    api("/api/saved-matches", { method: "DELETE", body }),

  list: (params?: string) =>
    api(`/api/saved-matches${params ? `?${params}` : ""}`),

  ids: (purpose?: string) =>
    api(`/api/saved-matches/ids${purpose ? `?purpose=${purpose}` : ""}`),
};

// Invitations API
export const invitationsApi = {
  send: (
    projectId: string,
    body: { userId: string; message?: string }
  ) => api(`/api/projects/${projectId}/invite`, { method: "POST", body }),
  mine: () => api("/api/invitations"),
  listForProject: (projectId: string) =>
    api(`/api/projects/${projectId}/invitations`),
  respond: (id: string, status: "ACCEPTED" | "REJECTED") =>
    api(`/api/invitations/${id}`, { method: "PUT", body: { status } }),
};

// Users search (davet için)
export const usersApi = {
  search: (q: string, role?: "STUDENT" | "PROFESSOR", limit = 10) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (role) p.set("role", role);
    p.set("limit", String(limit));
    return api(`/api/users/search?${p.toString()}`);
  },
};

// Professor Applications API (öğrenci → hoca direkt başvuru)
export const professorApplicationsApi = {
  send: (body: {
    professorId: string;
    purpose?: "PROJECT" | "ARTICLE";
    title: string;
    description: string;
    tagIds: string[];
    message?: string;
  }) => api("/api/professor-applications", { method: "POST", body }),
  incoming: () => api("/api/professor-applications/incoming"),
  mine: () => api("/api/professor-applications/mine"),
  respond: (
    id: string,
    body: { status: "ACCEPTED" | "REJECTED"; studentSlots?: number; professorSlots?: number }
  ) => api(`/api/professor-applications/${id}`, { method: "PUT", body }),
};

// AI API
export const aiApi = {
  suggestTags: (text: string, top_n?: number) =>
    api("/api/ai/suggest-tags", { method: "POST", body: { text, top_n } }),
  analyzeProfile: (bio: string, publications?: string[]) =>
    api("/api/ai/analyze-profile", {
      method: "POST",
      body: { bio, publications },
    }),
};
