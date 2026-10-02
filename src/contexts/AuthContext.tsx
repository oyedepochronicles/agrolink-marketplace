import {
  api,
  clearMfaToken,
  clearSession,
  getMfaToken,
  getToken,
  SESSION_EXPIRED_EVENT,
  setMfaToken,
  setRefreshToken,
  setToken,
} from "@/lib/api";
import type { NigerianLocationValue } from "@/lib/nigerianLocations";
import { disconnectSocket, getSocket } from "@/lib/socket";
import type { Role, User } from "@/types";
import { useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

interface LoginInput {
  email: string;
  password: string;
}
interface RegisterBuyerInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  location?: NigerianLocationValue;
}
interface AffiliateInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Extract<Role, "farmer" | "rider">;
  location?: NigerianLocationValue;
  state?: string;
  address?: string;
  farmName?: string;
  farmAddress?: string;
  farmLandmark?: string;
}

export type LoginResult =
  | { status: "authenticated"; user: User }
  | { status: "mfa_required" };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True while a login is awaiting an MFA code. No session exists yet. */
  mfaPending: boolean;
  login: (input: LoginInput) => Promise<LoginResult>;
  verifyMfaLogin: (code: string) => Promise<User>;
  cancelMfa: () => void;
  registerBuyer: (input: RegisterBuyerInput) => Promise<User>;
  registerAffiliate: (input: AffiliateInput) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthPayload {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  mfaRequired?: boolean;
  mfaToken?: string;
  requiresMfa?: boolean;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken());
  const [mfaPending, setMfaPending] = useState<boolean>(!!getMfaToken());
  const { i18n } = useTranslation();
  const { setTheme } = useTheme();

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<{ user: User } | User>("/auth/me");
      const u = (data as { user?: User }).user ?? (data as User);
      setUser(u);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A hard session loss (refresh token rejected) clears client state immediately.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setMfaPending(false);
      disconnectSocket();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // Manage socket connection alongside auth state
  useEffect(() => {
    if (user) getSocket();
    else disconnectSocket();
  }, [user]);

  // Preference precedence: an authenticated account preference OVERRIDES the
  // saved-local choice. On login/refresh, hydrate i18n language + color mode
  // from the account when (and only when) the user has explicitly set one.
  // `preferences` is absent for users who never opened the selector, so their
  // saved-local → browser → default chain is preserved (we never force a value
  // they didn't choose). Local changes made while signed in are persisted back
  // by `usePreferences`, so a subsequent refresh re-hydrates the same value.
  useEffect(() => {
    const prefs = user?.preferences;
    if (!prefs) return;
    if (prefs.language && prefs.language !== i18n.resolvedLanguage) {
      void i18n.changeLanguage(prefs.language);
    }
    if (prefs.theme) {
      setTheme(prefs.theme);
    }
  }, [user, i18n, setTheme]);

  const persistSession = (payload: AuthPayload): User => {
    const token = payload.token ?? payload.accessToken;
    if (token) setToken(token);
    if (payload.refreshToken) setRefreshToken(payload.refreshToken);
    clearMfaToken();
    setMfaPending(false);
    const u = (payload.user ?? (payload as unknown as User)) as User;
    setUser(u);
    return u;
  };

  const login = async (input: LoginInput): Promise<LoginResult> => {
    const { data } = await api.post<AuthPayload>("/auth/login", input);
    if (data?.mfaRequired || data?.requiresMfa) {
      // Always drop stale credentials before starting a new MFA challenge so an
      // old mfaToken cannot be replayed into the next sign-in flow.
      clearSession();
      setMfaToken(data.mfaToken ?? data.token ?? data.accessToken ?? "");
      setMfaPending(true);
      return { status: "mfa_required" };
    }
    return { status: "authenticated", user: persistSession(data) };
  };

  const verifyMfaLogin = async (code: string): Promise<User> => {
    const mfaToken = getMfaToken();
    const payload = { code, ...(mfaToken ? { mfaToken } : {}) };
    const { data } = await api.post<AuthPayload>(
      "/auth/mfa/verify-login",
      payload,
      mfaToken
        ? { headers: { Authorization: `Bearer ${mfaToken}` } }
        : undefined,
    );
    const u = persistSession(data);
    if (!data.user) await refresh();
    return u;
  };

  const cancelMfa = () => {
    clearSession();
    setMfaPending(false);
    setUser(null);
  };

  const registerBuyer = async (input: RegisterBuyerInput) => {
    const { data } = await api.post<AuthPayload>("/auth/register", input);
    return persistSession(data);
  };

  const registerAffiliate = async (input: AffiliateInput) => {
    const {
      location,
      state,
      address,
      farmName,
      farmAddress,
      farmLandmark,
      ...rest
    } = input;
    const resolvedLocation =
      location ||
      (state
        ? {
            state,
            lga: "",
            fullAddress: address,
          }
        : undefined);
    const { data } = await api.post<AuthPayload>("/auth/affiliate", {
      ...rest,
      termsAccepted: true,
      location: resolvedLocation,
      ...(input.role === "farmer"
        ? {
            farmerProfile: {
              farmName: farmName || input.name,
              farmAddress:
                farmAddress || resolvedLocation?.fullAddress || address,
              farmState: resolvedLocation?.state || state,
              farmLga: resolvedLocation?.lga,
              farmLandmark: farmLandmark || resolvedLocation?.landmark,
              farmPhone: input.phone,
            },
          }
        : {}),
      ...(input.role === "rider" ? { riderProfile: {} } : {}),
    });
    return persistSession(data);
  };

  const logout = () => {
    void api.post("/auth/logout").catch(() => undefined);
    clearSession();
    disconnectSocket();
    setMfaPending(false);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      mfaPending,
      login,
      verifyMfaLogin,
      cancelMfa,
      registerBuyer,
      registerAffiliate,
      logout,
      refresh,
    }),
    [user, loading, mfaPending, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
