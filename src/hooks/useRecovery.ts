import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

/*
 * Authenticator (MFA) recovery flow — used while the user is SIGNED OUT.
 *
 * Security notes that shape this file:
 *  - The recovery code is NEVER returned by the API and is never stored here.
 *  - `recoveryId` + `sessionToken` bind every step to its originating session.
 *    They live only in the page's React state (never localStorage, never the
 *    URL) and are passed explicitly into each mutation.
 *  - Success never yields a login session; the user must sign in afresh.
 */

export type RecoveryContactMethod = "email" | "phone";

export interface RecoveryStartResult {
  recoveryId: string;
  sessionToken: string;
  contactMethod: RecoveryContactMethod;
  maskedDestination: string;
  message: string;
}

export interface RecoveryVerifyResult {
  verified: true;
  recoveryId: string;
  message: string;
}

export interface RecoveryResendResult {
  recoveryId: string;
  message: string;
}

export interface RecoveryReenrollResult {
  otpauthUrl: string;
  secret: string;
  maskedDestination: string;
  message: string;
}

export interface RecoveryCompleteResult {
  mfaEnabled: boolean;
  message: string;
}

export interface RecoveryAppealResult {
  caseId: string;
  message: string;
}

export interface RecoveryAppealStatusResult {
  caseId: string;
  status: string;
}

/** Opaque session handle returned by `/recovery/start`, carried through steps. */
export interface RecoverySession {
  recoveryId: string;
  sessionToken: string;
}

const DEVICE_ID_KEY = "phyhan.recoveryDeviceId";

/**
 * A stable, non-sensitive per-browser identifier used only to correlate
 * recovery attempts from the same device. It carries no account information and
 * grants no access, so persisting it in localStorage is safe.
 */
export const getRecoveryDeviceId = (): string => {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
};

export const useRecoveryStart = () =>
  useMutation({
    mutationFn: async (contact: string) => {
      const { data } = await api.post<RecoveryStartResult>(
        "/auth/recovery/start",
        { contact: contact.trim(), deviceId: getRecoveryDeviceId() },
      );
      return data;
    },
  });

export const useRecoveryVerifyCode = () =>
  useMutation({
    mutationFn: async (input: RecoverySession & { code: string }) => {
      const { data } = await api.post<RecoveryVerifyResult>(
        "/auth/recovery/verify-code",
        input,
      );
      return data;
    },
  });

export const useRecoveryResend = () =>
  useMutation({
    mutationFn: async (input: RecoverySession) => {
      const { data } = await api.post<RecoveryResendResult>(
        "/auth/recovery/resend-code",
        input,
      );
      return data;
    },
  });

export const useRecoveryReenroll = () =>
  useMutation({
    mutationFn: async (input: RecoverySession) => {
      const { data } = await api.post<RecoveryReenrollResult>(
        "/auth/recovery/reenroll-mfa",
        input,
      );
      return data;
    },
  });

export const useRecoveryComplete = () =>
  useMutation({
    mutationFn: async (input: RecoverySession & { code: string }) => {
      const { data } = await api.post<RecoveryCompleteResult>(
        "/auth/recovery/complete",
        input,
      );
      return data;
    },
  });

/**
 * Upload an identity document for a recovery appeal while signed out. The
 * document goes to PRIVATE storage; the returned URL is only reachable through
 * the authenticated admin-only secure endpoint. Authorized by the recovery
 * session token, so no login is required.
 */
export const useRecoveryUploadDocument = () =>
  useMutation({
    mutationFn: async (input: RecoverySession & { file: File }) => {
      const fd = new FormData();
      fd.append("file", input.file);
      fd.append("recoveryId", input.recoveryId);
      fd.append("sessionToken", input.sessionToken);
      const { data } = await api.post<{ url: string; name?: string }>(
        "/uploads/recovery-document",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
  });

export const useRecoveryAppeal = () =>
  useMutation({
    mutationFn: async (input: {
      recoveryId?: string;
      sessionToken?: string;
      fullName: string;
      contact: string;
      reason: string;
      explanation?: string;
      documentUrl?: string;
    }) => {
      const { data } = await api.post<RecoveryAppealResult>(
        "/auth/recovery/appeal",
        input,
      );
      return data;
    },
  });

export const useRecoveryAppealStatus = () =>
  useMutation({
    mutationFn: async (input: { caseId: string; sessionToken?: string }) => {
      const { data } = await api.get<RecoveryAppealStatusResult>(
        `/auth/recovery/appeal/${encodeURIComponent(input.caseId)}`,
        input.sessionToken
          ? { params: { sessionToken: input.sessionToken } }
          : undefined,
      );
      return data;
    },
  });
