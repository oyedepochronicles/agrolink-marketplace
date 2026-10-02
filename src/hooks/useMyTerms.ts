// User-facing Terms & Conditions hooks (server: /api/terms — a base-user surface,
// NOT under the admin gate). The acceptance gate reads `pending` (active,
// acceptance-required terms for the user's audience they have not yet accepted at
// the current version) and records acceptance against the exact version.
//
// Reads fail OPEN (return []) so a transient network error never traps a user
// behind the blocking gate — real consent is still enforced server-side on every
// protected operation regardless of what the client shows.
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface PublicTerms {
  _id: string;
  documentKey: string;
  audience: string;
  version: number;
  title: string;
  summary?: string;
  content: string;
  effectiveFrom: string | null;
  requiresAcceptance: boolean;
  publishedAt?: string;
}

const myTermsKey = ["my-terms"] as const;

export const useMyPendingTerms = (enabled = true) =>
  useQuery({
    queryKey: [...myTermsKey, "pending"],
    enabled,
    queryFn: async (): Promise<PublicTerms[]> => {
      try {
        const { data } = await api.get<{ data: PublicTerms[] }>("/terms/pending");
        return data.data ?? [];
      } catch {
        // Fail open — never trap the user behind the gate on a transient error.
        return [];
      }
    },
  });

export const useMyActiveTerms = (enabled = true) =>
  useQuery({
    queryKey: [...myTermsKey, "active"],
    enabled,
    queryFn: async (): Promise<PublicTerms[]> => {
      try {
        const { data } = await api.get<{ data: PublicTerms[] }>("/terms/active");
        return data.data ?? [];
      } catch {
        return [];
      }
    },
  });

export const useAcceptTerms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: { version: number } }>(`/terms/${id}/accept`, {});
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: myTermsKey }),
  });
};
