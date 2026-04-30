import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "@/lib/api";
import type { Role, User } from "@/types";

interface LoginInput { email: string; password: string }
interface RegisterBuyerInput { name: string; email: string; phone?: string; password: string }
interface AffiliateInput {
  name: string; email: string; phone: string; password: string;
  role: Extract<Role, "farmer" | "rider">;
  state?: string; address?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<User>;
  registerBuyer: (input: RegisterBuyerInput) => Promise<User>;
  registerAffiliate: (input: AffiliateInput) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistAuth = (token: string) => setToken(token);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const { data } = await api.get<{ user: User } | User>("/auth/me");
      const u = (data as { user?: User }).user ?? (data as User);
      setUser(u);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleAuthResponse = (payload: { token?: string; user?: User } | User): User => {
    const token = (payload as { token?: string }).token;
    const u = (payload as { user?: User }).user ?? (payload as User);
    if (token) persistAuth(token);
    setUser(u);
    return u;
  };

  const login = async (input: LoginInput) => {
    const { data } = await api.post("/auth/login", input);
    return handleAuthResponse(data);
  };

  const registerBuyer = async (input: RegisterBuyerInput) => {
    const { data } = await api.post("/auth/register", input);
    return handleAuthResponse(data);
  };

  const registerAffiliate = async (input: AffiliateInput) => {
    const { data } = await api.post("/auth/affiliate", input);
    return handleAuthResponse(data);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user, loading, login, registerBuyer, registerAffiliate, logout, refresh,
  }), [user, loading, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
