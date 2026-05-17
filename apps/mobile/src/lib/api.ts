import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const COOKIE_KEY = "fp3.cookies";
const TOKEN_KEY = "fp3.bearer";

// Mobil cihaz API'ye localhost üzerinden erişemez, makinenin IP'sini kullanmalı.
// Öncelik sırası: 1) EXPO_PUBLIC_API_URL env  2) Metro host IP  3) localhost (web/sim)
function resolveApiUrl(): string {
  const env = (globalThis as any).process?.env;
  const fromEnv: string | undefined = env?.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost;

  if (hostUri && typeof hostUri === "string") {
    const host = hostUri.split(":")[0];
    if (host && host !== "localhost") {
      return `http://${host}:3001`;
    }
  }
  return "http://localhost:3001";
}

export const API_URL = resolveApiUrl();

// ─── Cookie store ────────────────────────────────────
// React Native fetch otomatik cookie tutmaz. Set-Cookie'leri yakalayıp,
// sonraki isteklerde Cookie header olarak gönderiyoruz.
let cookieCache: string | null = null;
const cookieLoadPromise: Promise<void> = (async () => {
  try {
    const value = await SecureStore.getItemAsync(COOKIE_KEY);
    if (value) cookieCache = value;
  } catch {
    // ignore
  }
})();

async function getCookie(): Promise<string | null> {
  await cookieLoadPromise;
  return cookieCache;
}

async function setCookie(value: string | null) {
  cookieCache = value;
  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(COOKIE_KEY);
    } else {
      await SecureStore.setItemAsync(COOKIE_KEY, value);
    }
  } catch {
    // ignore
  }
}

// ─── Bearer token (Better Auth bearer plugin) ───────
let tokenCache: string | null = null;
// SecureStore'dan tek seferlik eager yükleme — sonraki getToken çağrıları
// bu promise'i bekler, böylece ilk fetch'te de Authorization eklenir.
const tokenLoadPromise: Promise<void> = (async () => {
  try {
    const value = await SecureStore.getItemAsync(TOKEN_KEY);
    if (value) tokenCache = value;
  } catch {
    // ignore
  }
})();

async function getToken(): Promise<string | null> {
  await tokenLoadPromise;
  return tokenCache;
}

// Debug için: mevcut auth token'ın özetini al
export async function debugAuthState(): Promise<{
  hasToken: boolean;
  tokenPreview: string | null;
  apiUrl: string;
}> {
  const t = await getToken();
  return {
    hasToken: !!t,
    tokenPreview: t ? `${t.slice(0, 12)}…` : null,
    apiUrl: API_URL,
  };
}

async function setToken(value: string | null) {
  tokenCache = value;
  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, value);
    }
  } catch {
    // ignore
  }
}

export async function clearSession() {
  await setCookie(null);
  await setToken(null);
}

// Set-Cookie header'larından name=value çiftlerini çıkarır
function parseSetCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const result: Record<string, string> = {};
  // Bazı RN platformları virgülle birleştiriyor, ama Date içinde de virgül oluyor.
  // Basit yaklaşım: ", " ile başlayan ve "<COOKIE_NAME>=" pattern'ini ayrıştır.
  const parts = header.split(/,(?=\s*[^;,= ]+=)/);
  for (const part of parts) {
    const first = part.split(";")[0].trim();
    const eq = first.indexOf("=");
    if (eq > 0) {
      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1).trim();
      if (name) result[name] = value;
    }
  }
  return result;
}

function mergeCookies(existing: string | null, incoming: Record<string, string>): string {
  const map: Record<string, string> = {};
  if (existing) {
    for (const pair of existing.split(";")) {
      const p = pair.trim();
      const eq = p.indexOf("=");
      if (eq > 0) map[p.slice(0, eq)] = p.slice(eq + 1);
    }
  }
  for (const [k, v] of Object.entries(incoming)) {
    // Better-auth bazen "" değerle silmek isteyebilir
    if (v === "" || v === "deleted") {
      delete map[k];
    } else {
      map[k] = v;
    }
  }
  return Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

// ─── Core request ────────────────────────────────────
interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const [cookie, token] = await Promise.all([getCookie(), getToken()]);

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Better Auth CSRF kontrolü için Origin header bekliyor; API URL'imizi gönder.
      Origin: API_URL,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Better Auth bearer plugin sign-in/sign-up sonrası "set-auth-token" header'ı gönderir.
  const newToken = res.headers.get("set-auth-token");
  if (newToken) await setToken(newToken);

  // Set-Cookie yakala (web/desktop fallback)
  let setCookieHeader: string | null = null;
  const anyHeaders: any = res.headers;
  if (typeof anyHeaders.getSetCookie === "function") {
    const list = anyHeaders.getSetCookie();
    setCookieHeader = Array.isArray(list) && list.length ? list.join(", ") : null;
  } else {
    setCookieHeader = res.headers.get("set-cookie");
  }
  const incoming = parseSetCookies(setCookieHeader);
  if (Object.keys(incoming).length > 0) {
    const merged = mergeCookies(cookie, incoming);
    await setCookie(merged);
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && (data.error || data.message)) ||
      `İstek başarısız (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

// ─── Auth ────────────────────────────────────────────
async function authRequest(path: string, body: any) {
  const data = await api<any>(path, { method: "POST", body });
  // Bearer plugin response body'sinde de token döndürür — header okunamazsa fallback olarak alalım.
  const bodyToken = data?.token || data?.session?.token;
  if (bodyToken) await setToken(bodyToken);
  return data;
}

export const authApi = {
  signUp: (body: {
    email: string;
    password: string;
    name: string;
    role: string;
    department: string;
  }) => authRequest("/api/auth/sign-up/email", body),

  signIn: (body: { email: string; password: string }) =>
    authRequest("/api/auth/sign-in/email", body),

  signOut: async () => {
    try {
      await api("/api/auth/sign-out", { method: "POST" });
    } finally {
      await clearSession();
    }
  },

  getSession: () => api("/api/auth/get-session"),
};

// ─── Profile ─────────────────────────────────────────
export const profileApi = {
  getMe: () => api("/api/profile"),
  update: (body: any) => api("/api/profile", { method: "PUT", body }),
  getById: (id: string) => api(`/api/profile/${id}`),
  updateTags: (tagIds: string[]) =>
    api("/api/profile/tags", { method: "PUT", body: { tagIds } }),
};

// ─── Professors ──────────────────────────────────────
export const professorsApi = {
  list: (params?: string) =>
    api(`/api/professors${params ? `?${params}` : ""}`),
  getById: (id: string) => api(`/api/professors/${id}`),
};

// ─── Students ────────────────────────────────────────
export const studentsApi = {
  list: (params?: string) =>
    api(`/api/students${params ? `?${params}` : ""}`),
  getById: (id: string) => api(`/api/students/${id}`),
};

// ─── Projects ────────────────────────────────────────
export const projectsApi = {
  list: (params?: string) => api(`/api/projects${params ? `?${params}` : ""}`),
  getById: (id: string) => api(`/api/projects/${id}`),
  create: (body: any) => api("/api/projects", { method: "POST", body }),
  update: (id: string, body: any) =>
    api(`/api/projects/${id}`, { method: "PUT", body }),
  remove: (id: string) => api(`/api/projects/${id}`, { method: "DELETE" }),
  mine: () => api("/api/my-projects"),
};

// ─── Publications ────────────────────────────────────
export const publicationsApi = {
  list: (params?: string) =>
    api(`/api/publications${params ? `?${params}` : ""}`),
  getById: (id: string) => api(`/api/publications/${id}`),
  create: (body: any) => api("/api/publications", { method: "POST", body }),
  update: (id: string, body: any) =>
    api(`/api/publications/${id}`, { method: "PUT", body }),
  remove: (id: string) => api(`/api/publications/${id}`, { method: "DELETE" }),
};

// ─── Applications ────────────────────────────────────
export const applicationsApi = {
  apply: (projectId: string, body?: { message?: string }) =>
    api(`/api/projects/${projectId}/apply`, { method: "POST", body }),
  listForProject: (projectId: string, params?: string) =>
    api(
      `/api/projects/${projectId}/applications${params ? `?${params}` : ""}`
    ),
  updateStatus: (id: string, status: string) =>
    api(`/api/applications/${id}`, { method: "PUT", body: { status } }),
  myApplications: (params?: string) =>
    api(`/api/my-applications${params ? `?${params}` : ""}`),
  incoming: (params?: string) =>
    api(`/api/applications/incoming${params ? `?${params}` : ""}`),
};

// ─── Tags ────────────────────────────────────────────
export const tagsApi = {
  list: () => api("/api/tags"),
  getById: (id: string) => api(`/api/tags/${id}`),
};

// ─── Discover ────────────────────────────────────────
export const discoverApi = {
  professors: (params?: string) =>
    api(`/api/discover/professors${params ? `?${params}` : ""}`),
  projects: (params?: string) =>
    api(`/api/discover/projects${params ? `?${params}` : ""}`),
  students: (params?: string) =>
    api(`/api/discover/students${params ? `?${params}` : ""}`),
};

// ─── Matching ────────────────────────────────────────
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

// ─── Team Ideas (Ekip Kur) ──────────────────────────
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

// ─── Saved Matches ───────────────────────────────────
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

// ─── Invitations ─────────────────────────────────────
export const invitationsApi = {
  send: (projectId: string, body: { userId: string; message?: string }) =>
    api(`/api/projects/${projectId}/invite`, { method: "POST", body }),
  mine: () => api("/api/invitations"),
  listForProject: (projectId: string) =>
    api(`/api/projects/${projectId}/invitations`),
  respond: (id: string, status: "ACCEPTED" | "REJECTED") =>
    api(`/api/invitations/${id}`, { method: "PUT", body: { status } }),
};

// ─── Users (davet için arama) ────────────────────────
export const usersApi = {
  search: (q: string, role?: "STUDENT" | "PROFESSOR", limit = 10) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (role) p.set("role", role);
    p.set("limit", String(limit));
    return api(`/api/users/search?${p.toString()}`);
  },
};

// ─── Professor Applications (öğrenci → hoca direkt başvuru) ─
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

// ─── AI ──────────────────────────────────────────────
export const aiApi = {
  suggestTags: (text: string, top_n?: number) =>
    api("/api/ai/suggest-tags", { method: "POST", body: { text, top_n } }),
  analyzeProfile: (bio: string, publications?: string[]) =>
    api("/api/ai/analyze-profile", {
      method: "POST",
      body: { bio, publications },
    }),
};
