const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
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
