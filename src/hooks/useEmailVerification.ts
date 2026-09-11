import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EmailVerificationStatus {
  email?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  verificationStatus: "pending" | "verified" | "not_requested";
  resendAvailableAt?: string;
  nextRetryAt?: string;
}

// Raw shape returned by GET /api/auth/verification-status → { success, data }.
interface RawVerificationStatus {
  isVerified?: boolean;
  sentAt?: string | null;
  remindersSent?: number[];
  daysUntilExpiry?: number | null;
}

const KEY = ["verification-status"];

export const useEmailVerificationStatus = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<EmailVerificationStatus | null> => {
      try {
        const { data } = await api.get<
          { data?: RawVerificationStatus } | RawVerificationStatus
        >("/auth/verification-status");
        const d =
          (data as { data?: RawVerificationStatus }).data ??
          (data as RawVerificationStatus);
        if (!d) return null;
        const emailVerified = !!d.isVerified;
        return {
          emailVerified,
          verificationStatus: emailVerified
            ? "verified"
            : d.sentAt
              ? "pending"
              : "not_requested",
        };
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

export const useRequestEmailVerification = () =>
  useMutation({
    mutationFn: async (email?: string) => {
      // With a specific (possibly new) email → request verification of it via
      // { field, value }. Without one → resend a fresh code to the account's
      // current email. Both are backed by real /api/auth routes.
      if (email) {
        const { data } = await api.post("/auth/request-verification", {
          field: "email",
          value: email,
        });
        return data;
      }
      const { data } = await api.post("/auth/resend-verification", {});
      return data;
    },
  });

export const useResendEmailVerification = () =>
  useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/resend-verification", {});
      return data;
    },
  });

export const useVerifyEmailOtp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      // Server accepts { token } or { otp } at POST /auth/verify-email; the
      // 6-digit code entered here is the OTP.
      const { data } = await api.post("/auth/verify-email", { otp: code });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
