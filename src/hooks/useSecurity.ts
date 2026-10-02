import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { Role, User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

const unwrapList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  const d = data as Record<string, T[] | undefined>;
  return d?.items ?? d?.data ?? d?.logs ?? d?.events ?? d?.users ?? [];
};

/* -------------------- MFA (self service) -------------------- */

export interface MfaSetupResponse {
  secret?: string;
  otpauthUrl?: string;
  qrCode?: string;
  message?: string;
}

export const useSetupMfa = () =>
  useMutation({
    mutationFn: async () => {
      const { data } = await api.post<
        MfaSetupResponse | { data: MfaSetupResponse }
      >("/auth/mfa/setup");
      const d = data as { data?: MfaSetupResponse };
      return (d.data ?? data) as MfaSetupResponse;
    },
  });

export const useEnableMfa = () => {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (code: string) =>
      (await api.post("/auth/mfa/enable", { code })).data,
    onSuccess: () => refresh(),
  });
};

export const useDisableMfa = () => {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (code: string) =>
      (await api.post("/auth/mfa/disable", { code })).data,
    onSuccess: () => refresh(),
  });
};

/* -------------------- Audit + security events -------------------- */

export const useAuditLogs = (params?: {
  action?: string;
  page?: number;
  limit?: number;
}) =>
  useQuery({
    queryKey: ["admin-audit-logs", params ?? {}],
    queryFn: async () =>
      unwrapList<AuditLog>(
        (await api.get("/admin/audit-logs", { params })).data,
      ),
  });

export const useSecurityEvents = (params?: {
  severity?: string;
  page?: number;
  limit?: number;
}) =>
  useQuery({
    queryKey: ["admin-security-events", params ?? {}],
    queryFn: async () =>
      unwrapList<SecurityEvent>(
        (await api.get("/admin/security-events", { params })).data,
      ),
  });

/* -------------------- Admin user administration -------------------- */

export const useAdminTeam = () =>
  useQuery({
    queryKey: ["admin-team"],
    queryFn: async () =>
      unwrapList<User>((await api.get("/admin/admin-users")).data),
  });

const invalidateTeam = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["admin-team"] });
  qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
};

export const useInviteAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      role: Extract<Role, "admin" | "super_admin">;
    }) => {
      const { data } = await api.post<{ user?: User; inviteUrl?: string }>(
        "/admin/admin-users/invite",
        input,
      );
      return data;
    },
    onSuccess: () => invalidateTeam(qc),
  });
};

export const useResendAdminInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/admin/admin-users/${id}/resend-invite`)).data,
    onSuccess: () => invalidateTeam(qc),
  });
};

export const useSetAdminActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) =>
      (
        await api.patch(
          `/admin/admin-users/${id}/${active ? "reactivate" : "deactivate"}`,
        )
      ).data,
    onSuccess: () => invalidateTeam(qc),
  });
};

export const useResetUserMfa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/admin/users/${id}/reset-mfa`)).data,
    onSuccess: () => invalidateTeam(qc),
  });
};

export const useAcceptAdminInvite = () =>
  useMutation({
    mutationFn: async (input: { token: string; password: string }) =>
      (await api.post("/auth/accept-admin-invite", input)).data,
  });

/* -------------------- Account recovery appeals (admin) -------------------- */

export type RecoveryAppealStatus =
  | "pending"
  | "under_review"
  | "additional_info_required"
  | "approved"
  | "rejected"
  | "cancelled";

export interface RecoveryAppealHistoryEntry {
  at?: string;
  byId?: string;
  action?: string;
  note?: string;
}

export interface RecoveryAppeal {
  id: string;
  caseId: string;
  status: RecoveryAppealStatus;
  contactMethod?: "email" | "phone";
  /** Masked destination only — reviewers never see the full contact. */
  maskedAccount?: string;
  fullName?: string;
  reason?: string;
  explanation?: string;
  /** Authenticated admin-only secure URL; never the document bytes. */
  secureDocumentUrl?: string;
  assignedTo?: { id: string; name?: string; email?: string } | string;
  assignedAt?: string;
  hasAccount?: boolean;
  userId?: string;
  reviewNote?: string;
  createdAt?: string;
  updatedAt?: string;
  history?: RecoveryAppealHistoryEntry[];
}

export const useRecoveryAppeals = (status?: RecoveryAppealStatus | "") =>
  useQuery({
    queryKey: ["admin-recovery-appeals", status ?? ""],
    queryFn: async () =>
      unwrapList<RecoveryAppeal>(
        (
          await api.get("/admin/recovery-appeals", {
            params: status ? { status } : undefined,
          })
        ).data,
      ),
  });

const invalidateAppeals = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["admin-recovery-appeals"] });
  qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
};

export const useAssignRecoveryAppeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      assigneeId,
      note,
    }: {
      id: string;
      assigneeId?: string;
      note?: string;
    }) =>
      (
        await api.patch<{ appeal: RecoveryAppeal }>(
          `/admin/recovery-appeals/${id}/assign`,
          { assigneeId, note },
        )
      ).data,
    onSuccess: () => invalidateAppeals(qc),
  });
};

export const useReviewRecoveryAppeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: "approved" | "rejected" | "additional_info_required";
      note?: string;
    }) =>
      (
        await api.patch<{ appeal: RecoveryAppeal }>(
          `/admin/recovery-appeals/${id}/review`,
          { decision, note },
        )
      ).data,
    onSuccess: () => invalidateAppeals(qc),
  });
};
