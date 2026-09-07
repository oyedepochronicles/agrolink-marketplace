import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";

let baseUrl;
if (import.meta.env.MODE === "development") {
  baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
} else {
  baseUrl =
    import.meta.env.VITE_API_URL_PROD || "https://phyhanagro-new.onrender.com";
}
// Backend base URL — override with VITE_API_URL when deploying.
export const API_BASE_URL = baseUrl;

export const TOKEN_KEY = "phyhan.token";
export const REFRESH_TOKEN_KEY = "phyhan.refreshToken";
/** Short-lived token issued by /auth/login when MFA is pending. Never a session. */
export const MFA_TOKEN_KEY = "phyhan.mfaToken";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string) =>
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const clearRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY);

export const getMfaToken = () => localStorage.getItem(MFA_TOKEN_KEY);
export const setMfaToken = (token: string) => localStorage.setItem(MFA_TOKEN_KEY, token);
export const clearMfaToken = () => localStorage.removeItem(MFA_TOKEN_KEY);

/** Wipes every credential held by the browser. */
export const clearSession = () => {
  clearToken();
  clearRefreshToken();
  clearMfaToken();
};

/** Broadcast so the auth layer can react to a hard session loss. */
export const SESSION_EXPIRED_EVENT = "phyhan:session-expired";
const emitSessionExpired = () => {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
};

export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.set?.("Authorization", `Bearer ${token}`);
  }
  return config;
});

/* ------------------------------------------------------------------ */
/* Silent refresh: a single in-flight refresh shared by all callers.   */
/* ------------------------------------------------------------------ */

let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    }>(
      `${API_BASE_URL}/api/auth/refresh`,
      { refreshToken },
      { headers: { Authorization: `Bearer ${refreshToken}` }, timeout: 20000 },
    );
    const next = data.token ?? data.accessToken;
    if (!next) return null;
    setToken(next);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return next;
  } catch {
    return null;
  }
};

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const NO_RETRY = ["/auth/login", "/auth/refresh", "/auth/mfa/verify-login"];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = original?.url ?? "";

    if (status === 401 && original && !original._retried && !NO_RETRY.some((p) => url.includes(p))) {
      original._retried = true;
      const token = await refreshSession();
      if (token) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
        return api.request(original);
      }
      clearSession();
      emitSessionExpired();
    } else if (status === 401) {
      clearSession();
    }

    return Promise.reject(error);
  },
);

/** Classifies a failed request so the UI can respond consistently. */
export type SecurityErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "network_restricted"
  | "mfa_required"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server"
  | "network"
  | "unknown";

export const classifyError = (err: unknown): SecurityErrorKind => {
  const e = err as AxiosError<{ message?: string; code?: string; error?: string }>;
  const status = e?.response?.status;
  const raw = `${e?.response?.data?.code ?? ""} ${e?.response?.data?.message ?? ""}`.toLowerCase();
  if (!e?.response) return "network";
  if (status === 401) return raw.includes("mfa") ? "mfa_required" : "unauthenticated";
  if (status === 403) {
    if (raw.includes("ip") || raw.includes("network") || raw.includes("vpn")) return "network_restricted";
    if (raw.includes("mfa")) return "mfa_required";
    return "forbidden";
  }
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  if (status && status >= 500) return "server";
  return "unknown";
};

const GENERIC: Record<SecurityErrorKind, string> = {
  unauthenticated: "Your session has expired. Please sign in again.",
  forbidden: "You do not have permission to perform this action.",
  network_restricted:
    "This area is restricted to the approved network. Connect through the approved VPN and try again.",
  mfa_required: "Additional verification is required to continue.",
  not_found: "We couldn't find what you're looking for.",
  conflict: "That action conflicts with the current state. Refresh and try again.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  server: "Something went wrong on our side. Please try again shortly.",
  network: "Network problem. Check your connection and try again.",
  unknown: "Something went wrong. Please try again.",
};

/**
 * Safe, user-facing error text. Security-sensitive statuses always fall back to
 * a generic message so backend internals are never leaked to the UI.
 */
export const apiErrorMessage = (err: unknown): string => {
  const kind = classifyError(err);
  const e = err as AxiosError<{ message?: string; error?: string }>;
  if (kind === "forbidden" || kind === "network_restricted" || kind === "server" || kind === "unauthenticated") {
    return GENERIC[kind];
  }
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    GENERIC[kind] ||
    "Something went wrong. Please try again."
  );
};

export const assetUrl = (url?: string) => {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
};
