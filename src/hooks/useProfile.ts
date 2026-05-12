import { useAuth } from "@/contexts/AuthContext";
import { uploadFile } from "@/hooks/useChat";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const unwrapUser = (data: unknown): User => {
  const d = data as { user?: User; data?: User };
  return (d?.user ?? d?.data ?? data) as User;
};

/** Upload a new avatar image and persist on the user profile. */
export const useUpdateAvatar = () => {
  const { refresh } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadFile(file, file.name);
      if (!url) throw new Error("Upload failed");
      const { data } = await api.patch("/users/me", { avatar: url });
      return unwrapUser(data);
    },
    onSuccess: async () => {
      await refresh();
      qc.invalidateQueries();
    },
  });
};

interface VerificationPayload {
  documentType: string;
  documentNumber?: string;
  documentUrl: string;
  selfieUrl?: string;
  note?: string;
}

/** Submit verification request (buyer or any role). */
export const useSubmitVerification = () => {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (payload: VerificationPayload) => {
      const { data } = await api.post("/users/me/verification", payload);
      return data;
    },
    onSuccess: () => refresh(),
  });
};

/** Change user password. */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (payload: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const { data } = await api.post("/auth/change-password", payload);
      return data;
    },
  });
};
