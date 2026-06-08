import { api } from "@/lib/api";
import type { Product } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useCurrentLocation } from "./useLocation";

interface ProductFilters {
  q?: string;
  category?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  nearLat?: number;
  nearLng?: number;
}

interface ProductListResponse {
  items?: Product[];
  data?: Product[];
  products?: Product[];
  total?: number;
  page?: number;
  pages?: number;
  pageSize?: number;
  limit?: number;
}

export interface PagedProducts {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const unwrapProducts = (data: ProductListResponse | Product[]): PagedProducts => {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      pageSize: data.length || 12,
      totalPages: 1,
    };
  }
  const items = data.items ?? data.data ?? data.products ?? [];
  const pageSize = data.pageSize ?? data.limit ?? items.length ?? 12;
  const total = data.total ?? items.length;
  const totalPages = data.pages ?? (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1);
  return {
    items,
    total,
    page: data.page ?? 1,
    pageSize,
    totalPages,
  };
};

export const useProducts = (filters: ProductFilters = {}) =>
  useQuery({
    queryKey: ["products", filters],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<ProductListResponse | Product[]>("/products", {
        params: filters,
      });
      return unwrapProducts(data).items;
    },
  });

export const useProductsPaged = (filters: ProductFilters = {}) =>
  useQuery({
    queryKey: ["products", "paged", filters],
    queryFn: async (): Promise<PagedProducts> => {
      const { data } = await api.get<ProductListResponse | Product[]>("/products", {
        params: filters,
      });
      return unwrapProducts(data);
    },
    placeholderData: (prev) => prev,
  });

export const useProductsNearBy = () => {
  const { location, loading: locating, error } = useCurrentLocation();

  const hasLocation =
    !locating &&
    !error &&
    typeof location.lat === "number" &&
    typeof location.lng === "number";

  const query = useQuery({
    queryKey: ["products", "nearby", location.lat, location.lng],
    enabled: hasLocation,
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<ProductListResponse | Product[]>(
        "/products/nearby",
        { params: { lat: location.lat, lng: location.lng, radius: 10 } },
      );
      return unwrapProducts(data).items;
    },
  });

  return {
    ...query,
    locating,
    locationError: error,
    hasLocation,
    // Treat geo-loading as loading so UI shows skeleton instead of empty state.
    isLoading: locating || query.isLoading,
  };
};

export const useProduct = (id?: string) =>
  useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async (): Promise<Product> => {
      const { data } = await api.get<
        Product | { data: Product } | { product: Product }
      >(`/products/${id}`);
      return (
        (data as { data?: Product }).data ??
        (data as { product?: Product }).product ??
        (data as Product)
      );
    },
  });
