// Admin-side hooks for versioned fee & commission schedules
// (server: /api/admin/fees). Reads need `fees:read` (any admin may inspect the
// active schedule + history); writes (draft / edit / publish / archive) are
// super_admin-only and hard-gated server-side. Publishing a new version never
// rewrites a historical order's snapshot — each order keeps the exact version it
// was priced with (historical immutability).
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type FeeStatus = "draft" | "scheduled" | "active" | "archived" | "fallback";
export type RateType = "percent" | "flat";

export interface FeeRate {
  type: RateType;
  value: number;
  /** Optional floor on the resolved amount (Naira). `null` = unbounded. */
  min: number | null;
  /** Optional ceiling on the resolved amount (Naira). `null` = unbounded. */
  max: number | null;
}

export interface DeliveryRate {
  baseFee: number;
  perKmFee: number;
  expressMultiplier: number;
}

export interface FeeSchedule {
  /** `null` only for the virtual config/env fallback (version 0). */
  _id: string | null;
  version: number;
  status: FeeStatus;
  /** True for the resolved config/env baseline when nothing is published. */
  isFallback?: boolean;
  effectiveFrom: string | null;
  farmerFee: FeeRate;
  agentCommission: FeeRate;
  riderFee: FeeRate;
  serviceFee: FeeRate;
  tax: FeeRate;
  delivery: DeliveryRate;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  publishedBy?: string;
  publishedAt?: string;
  archivedBy?: string;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// A partial rate accepted by create/edit. The server validates each rate object
// with `.strict()`, so ONLY these four keys may be sent.
export interface FeeRateInput {
  type?: RateType;
  value?: number;
  min?: number | null;
  max?: number | null;
}

export interface FeeScheduleInput {
  farmerFee?: FeeRateInput;
  agentCommission?: FeeRateInput;
  riderFee?: FeeRateInput;
  serviceFee?: FeeRateInput;
  tax?: FeeRateInput;
  delivery?: Partial<DeliveryRate>;
  notes?: string;
}

const FEES_BASE = "/admin/fees";
const feesKey = ["admin", "fees"] as const;

export const useFeeSchedules = (enabled = true) =>
  useQuery({
    queryKey: [...feesKey, "list"],
    enabled,
    queryFn: async (): Promise<FeeSchedule[]> => {
      const { data } = await api.get<{ data: FeeSchedule[] }>(FEES_BASE);
      return data.data ?? [];
    },
  });

export const useActiveFeeSchedule = (enabled = true) =>
  useQuery({
    queryKey: [...feesKey, "active"],
    enabled,
    queryFn: async (): Promise<FeeSchedule> => {
      const { data } = await api.get<{ data: FeeSchedule }>(`${FEES_BASE}/active`);
      return data.data;
    },
  });

export const useCreateFeeDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FeeScheduleInput) => {
      const { data } = await api.post<{ data: FeeSchedule }>(FEES_BASE, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: feesKey }),
  });
};

export const useUpdateFeeDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: FeeScheduleInput & { id: string }) => {
      const { data } = await api.patch<{ data: FeeSchedule }>(`${FEES_BASE}/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: feesKey }),
  });
};

export const usePublishFeeSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, effectiveFrom }: { id: string; effectiveFrom?: string }) => {
      const body = effectiveFrom ? { effectiveFrom } : {};
      const { data } = await api.post<{ data: FeeSchedule }>(`${FEES_BASE}/${id}/publish`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: feesKey }),
  });
};

export const useArchiveFeeSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: FeeSchedule }>(`${FEES_BASE}/${id}/archive`, {});
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: feesKey }),
  });
};
