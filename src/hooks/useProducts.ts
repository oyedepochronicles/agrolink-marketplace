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
}

interface ProductNearByFilters extends ProductFilters {
  lat: number;
  lng: number;
  radius?: number; // in kilometers
  limit?: number;
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
      const { data } = await api.get<ProductListResponse | Product[]>(
        "/products",
        { params: filters },
      );
      if (Array.isArray(data)) return data;
      return data.items ?? data.data ?? data.products ?? [];
    },
  });
export const useProductsNearBy = () => {
  const { location, loading, error } = useCurrentLocation();

  const hasLocation =
    !loading &&
    !error &&
    typeof location.lat === "number" &&
    typeof location.lng === "number";

  const filters = hasLocation
    ? {
        lat: location.lat,
        lng: location.lng,
        radius: 10,
      }
    : null;

  return useQuery({
    queryKey: ["products", "nearby", location.lat, location.lng],
    enabled: hasLocation,
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<ProductListResponse | Product[]>(
        "/products/nearby",
        {
          params: filters!,
        },
      );

      if (Array.isArray(data)) return data;
      return data.items ?? data.data ?? data.products ?? [];
    },
  });
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
