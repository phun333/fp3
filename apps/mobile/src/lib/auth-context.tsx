import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authApi, clearSession } from "./api";

const USER_KEY = "fp3.user";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "PROFESSOR";
  department: string;
  bio?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
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

async function persistUser(u: AuthUser | null) {
  try {
    if (u) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
    else await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // ignore
  }
}

async function loadPersistedUser(): Promise<AuthUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const data: any = await authApi.getSession();
      const u = (data?.user as AuthUser) || null;
      setUser(u);
      await persistUser(u);
    } catch {
      // Ağ hatası: cache'deki kullanıcıyı tutmaya devam et
    } finally {
      setLoading(false);
    }
  }, []);

  // İlk açılışta önce SecureStore'dan kullanıcıyı yükle, sonra arka planda
  // session'ı doğrula. Böylece reload sonrası tekrar login gerekmez.
  useEffect(() => {
    (async () => {
      const cached = await loadPersistedUser();
      if (cached) {
        setUser(cached);
        setLoading(false);
      }
      await refreshSession();
    })();
  }, [refreshSession]);

  const signIn = async (email: string, password: string) => {
    const data: any = await authApi.signIn({ email, password });
    const u = (data?.user as AuthUser) || null;
    if (u) {
      setUser(u);
      await persistUser(u);
      setLoading(false);
    } else {
      await refreshSession();
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    department: string;
  }) => {
    const result: any = await authApi.signUp(data);
    const u = (result?.user as AuthUser) || null;
    if (u) {
      setUser(u);
      await persistUser(u);
      setLoading(false);
    } else {
      await refreshSession();
    }
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch {
      // ignore
    }
    await clearSession();
    await persistUser(null);
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
  if (!ctx) throw new Error("useAuth AuthProvider içinde kullanılmalı");
  return ctx;
}
