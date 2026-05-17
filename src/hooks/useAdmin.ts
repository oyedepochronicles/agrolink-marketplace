import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order, Product, Role, User } from "@/types";

interface UserListResp { items?: User[]; data?: User[]; users?: User[] }
interface ProductListResp { items?: Product[]; data?: Product[]; products?: Product[] }
interface OrderListResp { items?: Order[]; data?: Order[]; orders?: Order[] }

const unwrapUsers = (data: UserListResp | User[]): User[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.users ?? [];
};
const unwrapProducts = (data: ProductListResp | Product[]): Product[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.products ?? [];
};
const unwrapOrders = (data: OrderListResp | Order[]): Order[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.orders ?? [];
};

export const useAdminOrders = () =>
  useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () =>
      unwrapOrders((await api.get<OrderListResp | Order[]>("/admin/orders")).data),
  });

export const useAdminVerifications = () =>
  useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () =>
      unwrapUsers((await api.get<UserListResp | User[]>("/admin/verifications")).data),
  });

export const useAdminVerification = (id?: string) =>
  useQuery({
    queryKey: ["admin-verification", id],
    enabled: !!id,
    queryFn: async () => (await api.get<User>(`/admin/verifications/${id}`)).data,
  });

export const useAdminUsers = () =>
  useQuery({
    queryKey: ["admin-users"],
    queryFn: async () =>
      unwrapUsers((await api.get<UserListResp | User[]>("/admin/users")).data),
  });

export const useAdminProducts = () =>
  useQuery({
    queryKey: ["admin-products"],
    queryFn: async () =>
      unwrapProducts((await api.get<ProductListResp | Product[]>("/admin/products")).data),
  });

export const useAdminStats = () =>
  useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get<Record<string, number>>("/admin/stats");
      return data ?? {};
    },
  });

export const useReviewVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) => {
      const { data } = await api.patch<User>(`/admin/verifications/${id}/${action}`, reason ? { reason } : undefined);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useDeleteAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

export const useUpdateAdminUserSuspension = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isSuspended }: { id: string; isSuspended: boolean }) => {
      const { data } = await api.patch<{ user: User }>(`/admin/users/${id}/suspend`, { isSuspended });
      return data.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useUpdateAdminUserDeactivation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isDeactivated }: { id: string; isDeactivated: boolean }) => {
      const { data } = await api.patch<{ user: User }>(`/admin/users/${id}/deactivate`, { isDeactivated });
      return data.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useInviteAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; role: Extract<Role, "admin" | "super_admin"> }) => {
      const { data } = await api.post<{ user: User; inviteUrl?: string }>("/admin/admin-users/invite", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useDeleteAdminProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/products/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
};

export const useUpdateAdminProductStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: NonNullable<Product["status"]> }) => {
      const { data } = await api.patch<Product>(`/products/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateAdminProductAdminStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, adminStatus }: { id: string; adminStatus: NonNullable<Product["adminStatus"]> }) => {
      const { data } = await api.patch<{ product: Product }>(`/admin/products/${id}/admin-status`, { adminStatus });
      return data.product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

