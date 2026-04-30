import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/types";

interface ProductFilters {
  q?: string;
  category?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
}

interface ProductListResponse {
  items?: Product[];
  data?: Product[];
  products?: Product[];
  total?: number;
}

export const useProducts = (filters: ProductFilters = {}) =>
  useQuery({
    queryKey: ["products", filters],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<ProductListResponse | Product[]>("/products", { params: filters });
      if (Array.isArray(data)) return data;
      return data.items ?? data.data ?? data.products ?? [];
    },
  });

export const useProduct = (id?: string) =>
  useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async (): Promise<Product> => {
      const { data } = await api.get<Product | { data: Product } | { product: Product }>(`/products/${id}`);
      return (data as { data?: Product }).data
        ?? (data as { product?: Product }).product
        ?? (data as Product);
    },
  });
