import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product, User } from "@/types";

interface UserListResp { items?: User[]; data?: User[]; users?: User[] }
interface ProductListResp { items?: Product[]; data?: Product[]; products?: Product[] }

const unwrapUsers = (data: UserListResp | User[]): User[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.users ?? [];
};
const unwrapProducts = (data: ProductListResp | Product[]): Product[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.products ?? [];
};

export const useAdminVerifications = () =>
  useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () =>
      unwrapUsers((await api.get<UserListResp | User[]>("/admin/verifications")).data),
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
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      const { data } = await api.patch<User>(`/admin/verifications/${id}/${action}`);
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
