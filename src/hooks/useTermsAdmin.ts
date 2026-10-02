// Admin-side hooks for versioned Terms & Conditions
// (server: /api/admin/terms). Reads need `terms:read` (any admin may inspect the
// version history); writes (draft / edit / publish / archive) are super_admin-only
// and hard-gated server-side. Published versions are immutable — a change is
// always a NEW version, and every user acceptance keeps the exact version it was
// recorded against.
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type TermsStatus = "draft" | "scheduled" | "active" | "archived";
// Server audience enum (models/Terms.js AUDIENCES); `agent` maps to farm_agent.
export type TermsAudience = "all" | "buyer" | "farmer" | "rider" | "agent";

export interface TermsDoc {
  _id: string;
  documentKey: string;
  audience: TermsAudience;
  version: number;
  title: string;
  summary?: string;
  content: string;
  status: TermsStatus;
  effectiveFrom: string | null;
  requiresAcceptance: boolean;
  createdBy?: string;
  updatedBy?: string;
  publishedBy?: string;
  publishedAt?: string;
  archivedBy?: string;
  archivedAt?: string;
  notifiedAt?: string;
  notifiedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TermsListFilter {
  audience?: TermsAudience;
  documentKey?: string;
  status?: TermsStatus;
}

const TERMS_BASE = "/admin/terms";
const termsKey = ["admin", "terms"] as const;

export const useTermsList = (filter: TermsListFilter = {}, enabled = true) =>
  useQuery({
    queryKey: [...termsKey, "list", filter],
    enabled,
    queryFn: async (): Promise<TermsDoc[]> => {
      const params: Record<string, string> = {};
      if (filter.audience) params.audience = filter.audience;
      if (filter.documentKey) params.documentKey = filter.documentKey;
      if (filter.status) params.status = filter.status;
      const { data } = await api.get<{ data: TermsDoc[] }>(TERMS_BASE, { params });
      return data.data ?? [];
    },
  });

// documentKey defaults to 'general' server-side; audience/title/content required.
export interface CreateTermsInput {
  documentKey?: string;
  audience: TermsAudience;
  title: string;
  summary?: string;
  content: string;
  requiresAcceptance?: boolean;
}

export const useCreateTermsDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTermsInput) => {
      const { data } = await api.post<{ data: TermsDoc }>(TERMS_BASE, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: termsKey }),
  });
};

// Edit a draft in place. documentKey/audience/version are immutable and are NOT
// accepted by the server's strict update schema, so they are omitted here.
export interface UpdateTermsInput {
  id: string;
  title?: string;
  summary?: string;
  content?: string;
  requiresAcceptance?: boolean;
}

export const useUpdateTermsDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateTermsInput) => {
      const { data } = await api.patch<{ data: TermsDoc }>(`${TERMS_BASE}/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: termsKey }),
  });
};

export const usePublishTerms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, effectiveFrom }: { id: string; effectiveFrom?: string }) => {
      const body = effectiveFrom ? { effectiveFrom } : {};
      const { data } = await api.post<{ data: TermsDoc }>(`${TERMS_BASE}/${id}/publish`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: termsKey }),
  });
};

export const useArchiveTerms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: TermsDoc }>(`${TERMS_BASE}/${id}/archive`, {});
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: termsKey }),
  });
};
