import type { Product } from "@/types";

export interface PricingBreakdown {
  basePrice: number;
  finalPrice: number;
  discountAmount: number;
  discountPercent: number;
  hasDiscount: boolean;
  isActive: boolean;
  type: "fixed" | "percentage" | "none";
}

/**
 * Compute the effective price for a product based on its discount.
 * Supports fixed-amount and percentage discounts, with optional
 * startsAt / endsAt windows.
 */
export const getProductPricing = (product: Product): PricingBreakdown => {
  const basePrice = Number(product.price || 0);
  const d = product.discount;
  const type = (d?.type ?? "none") as PricingBreakdown["type"];
  const value = Number(d?.value || 0);

  const now = Date.now();
  const startsOk = d?.startsAt ? new Date(d.startsAt).getTime() <= now : true;
  const endsOk = d?.endsAt ? new Date(d.endsAt).getTime() >= now : true;
  const isActive = startsOk && endsOk && type !== "none" && value > 0;

  let discountAmount = 0;
  if (isActive) {
    discountAmount =
      type === "percentage"
        ? Math.round((basePrice * Math.min(value, 100)) / 100)
        : Math.min(value, basePrice);
  }

  const finalPrice = Math.max(0, basePrice - discountAmount);
  const discountPercent =
    basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

  return {
    basePrice,
    finalPrice,
    discountAmount,
    discountPercent,
    hasDiscount: discountAmount > 0,
    isActive,
    type,
  };
};
