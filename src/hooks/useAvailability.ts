import { api } from "@/lib/api";
import type { User } from "@/types";
import { useMutation } from "@tanstack/react-query";

/**
 * Farmer/rider self-service availability switch.
 * PATCH /auth/availability expects an explicit `{ isAvailable }` value and
 * returns the updated (sanitised) user. Callers should refresh the auth
 * context afterwards so `user.isAvailable` reflects the new state.
 */
export const useToggleAvailability = () =>
  useMutation({
    mutationFn: async (isAvailable: boolean): Promise<User> => {
      const { data } = await api.patch<{ user: User; message?: string }>(
        "/auth/availability",
        { isAvailable },
      );
      return data.user;
    },
  });
