import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/types";

interface ListResp { items?: Product[]; data?: Product[]; products?: Product[] }

export const useFarmerProducts = () =>
  useQuery({
    queryKey: ["farmer-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<ListResp | Product[]>("/products/mine");
      if (Array.isArray(data)) return data;
      return data.items ?? data.data ?? data.products ?? [];
    },
  });

export interface ProductInput {
  title: string;
  description?: string;
  price: number;
  unit?: string;
  category?: string;
  state?: string;
  stock?: number;
  harvestDate?: string;
  expectedHarvestDate?: string;
  isPreHarvest?: boolean;
  images?: string[];
}

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const { data } = await api.post<Product>("/products", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ProductInput>) => {
      const { data } = await api.put<Product>(`/products/${id}`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProductStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "available" | "reserved" | "sold" | "expired" }) => {
      const { data } = await api.patch<Product>(`/products/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUploadImage = () =>
  useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<{ url?: string; secure_url?: string; path?: string }>(
        "/uploads",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data.url ?? data.secure_url ?? data.path ?? "";
    },
  });
