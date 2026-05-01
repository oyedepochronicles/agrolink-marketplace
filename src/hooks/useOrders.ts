import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";

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
