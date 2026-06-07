import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Package, Tag } from "lucide-react";
import type { Product } from "@/types";
import { formatNaira } from "@/lib/format";
import { getProductPricing } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { SLABadge } from "@/components/marketplace/SLABadge";

interface Props { product: Product; className?: string }

export const ProductCard = ({ product, className }: Props) => {
  const id = product._id ?? product.id;
  const image = product.images?.[0];
  const harvestDate = product.expectedHarvestDate || product.harvestDate;
  const pricing = getProductPricing(product);

  return (
    <Link
      to={`/marketplace/product/${id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-spring hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {image ? (
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-spring group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground backdrop-blur">
            {product.category}
          </span>
        )}
        {pricing.hasDiscount && (
          <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground shadow-glow">
            <Tag className="h-3 w-3" /> -{pricing.discountPercent}% OFF
          </span>
        )}
        <div className="absolute right-3 top-3">
          <SLABadge product={product} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{product.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{product.state ?? product.farmer?.state ?? "Nigeria"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/75">
          <Package className="h-3.5 w-3.5" />
          <span>{product.quantity ?? product.stock ?? 0} {product.unit || "unit"} available</span>
        </div>
        {product.isPreHarvest && harvestDate && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Harvests {new Date(harvestDate).toLocaleDateString()}</span>
          </div>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            {pricing.hasDiscount && (
              <span className="text-xs font-medium text-muted-foreground line-through">
                {formatNaira(pricing.basePrice)}
              </span>
            )}
            <span className="font-display text-lg font-extrabold text-primary leading-tight">
              {formatNaira(pricing.finalPrice)}
              {product.unit && (
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  / {product.unit}
                </span>
              )}
            </span>
            {pricing.hasDiscount && (
              <span className="text-[11px] font-semibold text-success">
                Save {formatNaira(pricing.discountAmount)}
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
};
