// Farm Exchange farmer-facing hooks (server: /api/exchange). The exchange is the
// verified-farmer<->verified-farmer by-product marketplace — a surface HARD-
// partitioned from the consumer marketplace (marketType:'exchange', enforced
// server-side). Every endpoint here is gated by requireVerifiedFarmer on the
// backend; the client only surfaces the entry points to verified farmers.
//
// Response envelope: list endpoints return the array directly on `data.data` with
// `meta` alongside (mirrors useAdminAgents); single-resource endpoints return the
// object on `data.data`. baseURL already includes `/api`, so paths omit it.
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ExchangeByproduct,
  ExchangeDeliveryOption,
  ExchangeListing,
  ExchangeOrder,
  ExchangeOrderStatus,
  ExchangePageMeta,
} from "@/types/exchange";

const EXCHANGE_BASE = "/exchange";
const exchangeKey = ["exchange"] as const;

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export interface BrowseListingsParams {
  category?: string;
  state?: string;
  lga?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BrowseListingsResult {
  items: ExchangeListing[];
  meta?: ExchangePageMeta;
}

/** Browse other farmers' active exchange listings (own listings excluded server-side). */
export const useExchangeListings = (params: BrowseListingsParams = {}) =>
  useQuery({
    queryKey: [...exchangeKey, "browse", params],
    queryFn: async (): Promise<BrowseListingsResult> => {
      const { data } = await api.get<{
        data: ExchangeListing[];
        meta?: ExchangePageMeta;
      }>(`${EXCHANGE_BASE}/listings`, { params });
      return { items: data.data ?? [], meta: data.meta };
    },
  });

/** The current farmer's own exchange listings. */
export const useMyExchangeListings = () =>
  useQuery({
    queryKey: [...exchangeKey, "mine"],
    queryFn: async (): Promise<ExchangeListing[]> => {
      const { data } = await api.get<{ data: ExchangeListing[] }>(
        `${EXCHANGE_BASE}/listings/mine`,
      );
      return data.data ?? [];
    },
  });

/** A single listing's public detail (never carries the owner's contact). */
export const useExchangeListing = (id?: string, enabled = true) =>
  useQuery({
    queryKey: [...exchangeKey, "detail", id],
    enabled: !!id && enabled,
    queryFn: async (): Promise<ExchangeListing> => {
      const { data } = await api.get<{ data: ExchangeListing }>(
        `${EXCHANGE_BASE}/listings/${id}`,
      );
      return data.data;
    },
  });

// The client never sends marketType — the server stamps 'exchange'. `status` is
// only meaningful on update (relist/withdraw).
export interface ListingInput {
  name: string;
  description?: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  deliveryOption?: ExchangeDeliveryOption;
  location?: { state?: string; lga?: string };
  harvestDate?: string;
  images?: string[];
  byproduct?: ExchangeByproduct;
  status?: ExchangeListing["status"];
}

export const useCreateExchangeListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ListingInput): Promise<ExchangeListing> => {
      const { data } = await api.post<{ data: ExchangeListing }>(
        `${EXCHANGE_BASE}/listings`,
        input,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: exchangeKey }),
  });
};

export const useUpdateExchangeListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ListingInput>;
    }): Promise<ExchangeListing> => {
      const { data } = await api.patch<{ data: ExchangeListing }>(
        `${EXCHANGE_BASE}/listings/${id}`,
        input,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: exchangeKey }),
  });
};

export const useDeleteExchangeListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ _id: string }> => {
      const { data } = await api.delete<{ data: { _id: string } }>(
        `${EXCHANGE_BASE}/listings/${id}`,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: exchangeKey }),
  });
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/** Orders the current farmer has PLACED (as buyer). */
export const useExchangePurchases = (status?: ExchangeOrderStatus) =>
  useQuery({
    queryKey: [...exchangeKey, "purchases", status ?? "all"],
    queryFn: async (): Promise<ExchangeOrder[]> => {
      const { data } = await api.get<{ data: ExchangeOrder[] }>(
        `${EXCHANGE_BASE}/orders/purchases`,
        { params: status ? { status } : {} },
      );
      return data.data ?? [];
    },
  });

/** Orders placed against the current farmer's listings (as seller). */
export const useExchangeSales = (status?: ExchangeOrderStatus) =>
  useQuery({
    queryKey: [...exchangeKey, "sales", status ?? "all"],
    queryFn: async (): Promise<ExchangeOrder[]> => {
      const { data } = await api.get<{ data: ExchangeOrder[] }>(
        `${EXCHANGE_BASE}/orders/sales`,
        { params: status ? { status } : {} },
      );
      return data.data ?? [];
    },
  });

export interface PlaceOrderInput {
  productId: string;
  quantity: number;
  buyerNote?: string;
}

export const usePlaceExchangeOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlaceOrderInput): Promise<ExchangeOrder> => {
      const { data } = await api.post<{ data: ExchangeOrder }>(
        `${EXCHANGE_BASE}/orders`,
        input,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: exchangeKey }),
  });
};

// accept/reject/cancel/complete share a shape: an order id + optional note. The
// server enforces who may perform each transition (seller accepts/rejects, buyer
// cancels, either completes) — the client never assumes authorization.
type OrderAction = "accept" | "reject" | "cancel" | "complete";

const useOrderTransition = (action: OrderAction) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decisionNote,
    }: {
      id: string;
      decisionNote?: string;
    }): Promise<ExchangeOrder> => {
      const { data } = await api.post<{ data: ExchangeOrder }>(
        `${EXCHANGE_BASE}/orders/${id}/${action}`,
        decisionNote ? { decisionNote } : {},
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: exchangeKey }),
  });
};

/** Seller accepts a pending order — this is what shares contact with the buyer. */
export const useAcceptExchangeOrder = () => useOrderTransition("accept");
/** Seller rejects a pending order. */
export const useRejectExchangeOrder = () => useOrderTransition("reject");
/** Buyer cancels their own pending order. */
export const useCancelExchangeOrder = () => useOrderTransition("cancel");
/** Either party marks an accepted order completed (settlement happened offline). */
export const useCompleteExchangeOrder = () => useOrderTransition("complete");
