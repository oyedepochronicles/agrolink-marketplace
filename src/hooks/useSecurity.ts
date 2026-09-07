import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Role, User } from "@/types";

export interface AuditLog {
  _id: string;
  action: string;
  actor?: Pick<User, "_id" | "name" | "email" | "role">;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SecurityEvent {
  _id: string;
  type: string;
  severity?: "low" | "medium" | "high" | "critical";
  message?: string;
  user?: Pick<User, "_id" | "name" | "email" | "role">;
  email?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

const unwrapList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  const d = data as Record<string, T[] | undefined>;
  return d?.items ?? d?.data ?? d?.logs ?? d?.events ?? d?.users ?? [];
};

/* -------------------- MFA (self service) -------------------- */

export interface MfaSetupResponse {
  secret?: string;
  otpauthUrl?: string;
  qrCode?: string;
  qrCodeUrl?: string;
}

export const useSetupMfa = () =>
  useMutation({
    mutationFn: async () => {
      const { data } = await api.post<MfaSetupResponse | { data: MfaSetupResponse }>("/auth/mfa/setup");
      const d = data as { data?: MfaSetupResponse };
      return (d.data ?? data) as MfaSetupResponse;
    },
  });

export const useEnableMfa = () => {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (code: string) => (await api.post("/auth/mfa/enable", { code })).data,
    onSuccess: () => refresh(),
  });
};

export const useDisableMfa = () => {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (code: string) => (await api.post("/auth/mfa/disable", { code })).data,
    onSuccess: () => refresh(),
  });
};

/* -------------------- Audit + security events -------------------- */

export const useAuditLogs = (params?: { action?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ["admin-audit-logs", params ?? {}],
    queryFn: async () =>
      unwrapList<AuditLog>((await api.get("/admin/audit-logs", { params })).data),
  });

export const useSecurityEvents = (params?: { severity?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ["admin-security-events", params ?? {}],
    queryFn: async () =>
      unwrapList<SecurityEvent>((await api.get("/admin/security-events", { params })).data),
  });

/* -------------------- Admin user administration -------------------- */

export const useAdminTeam = () =>
  useQuery({
    queryKey: ["admin-team"],
    queryFn: async () => unwrapList<User>((await api.get("/admin/admin-users")).data),
  });

const invalidateTeam = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["admin-team"] });
  qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
};

export const useInviteAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; role: Extract<Role, "admin" | "super_admin"> }) => {
      const { data } = await api.post<{ user?: User; inviteUrl?: string }>("/admin/admin-users/invite", input);
      return data;
    },
    onSuccess: () => invalidateTeam(qc),
  });
};

export const useResendAdminInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/admin/admin-users/${id}/resend-invite`)).data,
    onSuccess: () => invalidateTeam(qc),
  });
};

export const useSetAdminActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) =>
      (await api.patch(`/admin/admin-users/${id}/${active ? "reactivate" : "deactivate"}`)).data,
    onSuccess: () => invalidateTeam(qc),
  });
};

export const useResetUserMfa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/admin/users/${id}/reset-mfa`)).data,
    onSuccess: () => invalidateTeam(qc),
  });
};

export const useAcceptAdminInvite = () =>
  useMutation({
    mutationFn: async (input: { token: string; password: string }) =>
      (await api.post("/auth/accept-admin-invite", input)).data,
  });
