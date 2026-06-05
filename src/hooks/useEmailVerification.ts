import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EmailVerificationStatus {
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  verificationStatus: "pending" | "verified" | "not_requested";
  resendAvailableAt?: string;
  nextRetryAt?: string;
}

const KEY = ["email-verification-status"];

export const useEmailVerificationStatus = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<EmailVerificationStatus | null> => {
      try {
        const { data } = await api.get<EmailVerificationStatus>(
          "/auth/email-verification-status",
        );
        return data;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

export const useRequestEmailVerification = () =>
  useMutation({
    mutationFn: async (email?: string) => {
      const { data } = await api.post("/auth/request-email-verification", {
        email,
      });
      return data;
    },
  });

export const useResendEmailVerification = () =>
  useMutation({
    mutationFn: async () => {
      const { data } = await api.patch("/auth/resend-email-verification", {});
      return data;
    },
  });

export const useVerifyEmailOtp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post("/auth/verify-email-otp", { code });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
