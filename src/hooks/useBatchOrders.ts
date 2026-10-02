// Batch-based order hooks. Endpoints are documented in the PhyhanAgro API doc
// (parent orders + per-batch fulfillment). They may 404 until the backend ships;
// callers should gracefully render empty / loading states.
import { api } from "@/lib/api";
import type { Batch, ParentOrder } from "@/types/batch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Listish<T> = T[] | { items?: T[]; data?: T[] };

const unwrap = <T,>(data: Listish<T>): T[] =>
  Array.isArray(data) ? data : (data.items ?? data.data ?? []);

// ---------- Buyer ----------
export const useBuyerParentOrders = () =>
  useQuery({
    queryKey: ["parent-orders", "buyer"],
    queryFn: async (): Promise<ParentOrder[]> => {
      const { data } = await api.get<Listish<ParentOrder>>("/parent-orders/my");
      return unwrap(data);
    },
  });

export const useParentOrder = (id?: string) =>
  useQuery({
    enabled: !!id,
    queryKey: ["parent-orders", id],
    queryFn: async (): Promise<ParentOrder | null> => {
      const { data } = await api.get<ParentOrder>(`/parent-orders/${id}`);
      return data;
    },
  });

// ---------- Farmer ----------
export const useFarmerBatches = () =>
  useQuery({
    queryKey: ["batches", "farmer"],
    queryFn: async (): Promise<Batch[]> => {
      try {
        const { data } = await api.get<Listish<Batch>>("/batches/farmer");
        return unwrap(data);
      } catch {
        return [];
      }
    },
  });

// ---------- Rider ----------
export const useRiderBatches = () =>
  useQuery({
    queryKey: ["batches", "rider"],
    queryFn: async (): Promise<Batch[]> => {
      try {
        const { data } = await api.get<Listish<Batch>>("/batches/rider");
        return unwrap(data);
      } catch {
        return [];
      }
    },
  });

/** Unassigned, ready batches a rider can claim (GET /batches/available). */
export const useAvailableBatches = () =>
  useQuery({
    queryKey: ["batches", "available"],
    queryFn: async (): Promise<Batch[]> => {
      try {
        const { data } = await api.get<Listish<Batch>>("/batches/available");
        return unwrap(data);
      } catch {
        return [];
      }
    },
  });

// ---------- Mutations ----------
export const useUpdateBatchStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch<Batch>(`/batches/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["parent-orders"] });
    },
  });
};

/** Rider claims an available batch (POST /batches/:id/accept). */
export const useAcceptBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Batch> => {
      const { data } = await api.post<Batch>(`/batches/${id}/accept`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
    },
  });
};
