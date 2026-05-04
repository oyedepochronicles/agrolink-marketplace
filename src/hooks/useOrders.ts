import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order, OrderStatus, User } from "@/types";

interface ListResp { items?: Order[]; data?: Order[]; orders?: Order[] }

const unwrap = (data: ListResp | Order[]): Order[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.orders ?? [];
};

export const useFarmerOrders = () =>
  useQuery({
    queryKey: ["farmer-orders"],
    queryFn: async () => unwrap((await api.get<ListResp | Order[]>("/orders/farmer")).data),
  });

export const useRiderDeliveries = () =>
  useQuery({
    queryKey: ["rider-deliveries"],
    queryFn: async () => unwrap((await api.get<ListResp | Order[]>("/orders/rider")).data),
  });

export const useAvailableDeliveries = () =>
  useQuery({
    queryKey: ["available-deliveries"],
    queryFn: async () => unwrap((await api.get<ListResp | Order[]>("/orders/available")).data),
  });

/** Riders the farmer can assign — defaults to /users?role=rider */
export const useAvailableRiders = () =>
  useQuery({
    queryKey: ["available-riders"],
    queryFn: async () => {
      const { data } = await api.get<{ items?: User[]; data?: User[]; users?: User[] } | User[]>(
        "/users",
        { params: { role: "rider" } },
      );
      if (Array.isArray(data)) return data;
      return data.items ?? data.data ?? data.users ?? [];
    },
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data } = await api.patch<Order>(`/orders/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
    },
  });
};

/** Farmer accepts/declines an incoming order so the buyer can proceed to pay. */
export const useRespondToOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "decline" }) => {
      const { data } = await api.post<Order>(`/orders/${id}/${action}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farmer-orders"] }),
  });
};

/** Farmer records an offline (out-of-app) payment. Backend marks order paid and deducts platform fee. */
export const useRecordOfflinePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; amount: number; quantity: number; note?: string }) => {
      const { data } = await api.post<Order>(`/orders/${input.id}/offline-payment`, {
        amount: input.amount,
        quantity: input.quantity,
        note: input.note,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      qc.invalidateQueries({ queryKey: ["wallet-summary"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });
};

/** Farmer assigns a rider to an order. */
export const useAssignRider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, riderId }: { id: string; riderId: string }) => {
      const { data } = await api.post<Order>(`/orders/${id}/assign-rider`, { riderId });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
    },
  });
};

export const useAcceptDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Order>(`/orders/${id}/accept`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
    },
  });
};
