import { api } from "@/lib/api";
import type { ProductRatingSummary, Review } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ListResp {
  items?: Review[];
  data?: Review[];
  reviews?: Review[];
}

const unwrap = (data: ListResp | Review[]): Review[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.reviews ?? [];
};

export const useProductReviews = (productId?: string) =>
  useQuery({
    queryKey: ["reviews", productId],
    enabled: !!productId,
    queryFn: async () =>
      unwrap(
        (await api.get<ListResp | Review[]>(`/products/${productId}/reviews`))
          .data,
      ),
  });

export const useProductRating = (productId?: string) =>
  useQuery({
    queryKey: ["reviews-summary", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await api.get<ProductRatingSummary>(
        `/products/${productId}/reviews/summary?productId=${productId}`,
      );
      return data ?? { average: 0, count: 0 };
    },
  });

export const useCreateReview = (productId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { rating: number; body?: string }) => {
      if (!productId)
        throw new Error("productId is required to create a review");
      const { data } = await api.post(`/products/${productId}/reviews`, {
        productId,
        ...input,
      });
      return data as Review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["reviews-summary", productId] });
      qc.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
};

export const useReplyToReview = (productId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { reviewId: string; body: string }) => {
      const { data } = await api.post(`/reviews/${input.reviewId}/reply`, {
        body: input.body,
      });
      return data as Review;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", productId] }),
  });
};
