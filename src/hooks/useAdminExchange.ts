// Admin Farm Exchange moderation hooks (server: /api/admin/exchange). Reads need
// `exchange:read`; suspend/reinstate needs `exchange:moderate`. Both are ADMIN-
// default tokens — the admin oversees the farmer<->farmer exchange but never
// transacts in it. The backend audits every moderation (MODERATE_EXCHANGE_LISTING).
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ExchangeAdminStatus,
  ExchangeListing,
  ExchangeListingStatus,
  ExchangePageMeta,
} from "@/types/exchange";

const ADMIN_EXCHANGE_BASE = "/admin/exchange";
const adminExchangeKey = ["admin", "exchange"] as const;

export interface AdminExchangeParams {
  status?: ExchangeListingStatus;
  adminStatus?: ExchangeAdminStatus;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminExchangeResult {
  items: ExchangeListing[];
  meta?: ExchangePageMeta;
}

/** All exchange listings for moderation (array on `data.data`, `meta` alongside). */
export const useAdminExchangeListings = (params: AdminExchangeParams = {}) =>
  useQuery({
    queryKey: [...adminExchangeKey, "list", params],
    queryFn: async (): Promise<AdminExchangeResult> => {
      const { data } = await api.get<{
        data: ExchangeListing[];
        meta?: ExchangePageMeta;
      }>(`${ADMIN_EXCHANGE_BASE}/listings`, { params });
      return { items: data.data ?? [], meta: data.meta };
    },
  });

/** Suspend (inactive) or reinstate (active) a listing. Needs `exchange:moderate`. */
export const useModerateExchangeListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      adminStatus,
    }: {
      id: string;
      adminStatus: ExchangeAdminStatus;
    }): Promise<ExchangeListing> => {
      const { data } = await api.patch<{ data: ExchangeListing }>(
        `${ADMIN_EXCHANGE_BASE}/listings/${id}/admin-status`,
        { adminStatus },
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminExchangeKey }),
  });
};
