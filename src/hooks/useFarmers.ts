import { api } from "@/lib/api";
import type { Product, User } from "@/types";
import { useQuery } from "@tanstack/react-query";

export interface FarmerFilters {
  q?: string;
  state?: string;
  lga?: string;
  page?: number;
  limit?: number;
}

/** Public directory farmer — identity fields are stripped server-side. */
export type DirectoryFarmer = Pick<
  User,
  | "_id"
  | "name"
  | "location"
  | "verificationStatus"
  | "avgRating"
  | "ratingsCount"
  | "profileImage"
  | "phone"
> & { farmerProfile?: User["farmerProfile"] };

interface FarmersResponse {
  items: DirectoryFarmer[];
  meta: { total: number; page: number; limit: number; pages: number };
}

/** A farmer review as returned by GET /farmers/:id/reviews (server shape). */
export interface FarmerReview {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  buyerId?: { _id: string; name: string };
  productId?: { _id: string; name: string };
  reply?: { body?: string; createdAt?: string };
}

const EMPTY_META = { total: 0, page: 1, limit: 12, pages: 0 };

export const useFarmers = (filters: FarmerFilters = {}) =>
  useQuery({
    queryKey: ["farmers", filters],
    queryFn: async (): Promise<FarmersResponse> => {
      const { data } = await api.get<FarmersResponse>("/farmers", {
        params: filters,
      });
      return {
        items: data?.items ?? [],
        meta: data?.meta ?? EMPTY_META,
      };
    },
    placeholderData: (prev) => prev,
  });

export const useFarmer = (id?: string) =>
  useQuery({
    queryKey: ["farmer", id],
    enabled: !!id,
    queryFn: async (): Promise<{ farmer: DirectoryFarmer; products: Product[] }> => {
      const { data } = await api.get<{ farmer: DirectoryFarmer; products: Product[] }>(
        `/farmers/${id}`,
      );
      return { farmer: data.farmer, products: data.products ?? [] };
    },
  });

export const useFarmerReviews = (id?: string) =>
  useQuery({
    queryKey: ["farmer-reviews", id],
    enabled: !!id,
    queryFn: async (): Promise<FarmerReview[]> => {
      const { data } = await api.get<FarmerReview[]>(`/farmers/${id}/reviews`);
      return Array.isArray(data) ? data : [];
    },
  });
