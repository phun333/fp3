"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "./api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "PROFESSOR";
  department: string;
  bio?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    department: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = "fp3.user";

function loadCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function saveCachedUser(u: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (u) window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    else window.localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // İlk açılışta localStorage'taki kullanıcıyı yükle — API gelmeden de oturum
  // açık görünür. Arka planda /get-session ile doğrulanır.
  const [user, setUser] = useState<User | null>(() => loadCachedUser());
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const data = await authApi.getSession();
      const u = (data?.user as User) || null;
      setUser(u);
      saveCachedUser(u);
    } catch {
      // Ağ hatası (örn. API restart sırasında): cache'deki kullanıcıyı koru.
      // Sadece API "user yok" derse user state'i temizleriz.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = async (email: string, password: string) => {
    await authApi.signIn({ email, password });
    await refreshSession();
  };

  const signUp = async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    department: string;
  }) => {
    await authApi.signUp(data);
    await refreshSession();
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch {
      // ignore
    }
    saveCachedUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
