import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  size?: "sm" | "md" | "lg";
  onChange?: (v: number) => void;
  className?: string;
  showValue?: boolean;
  count?: number;
}

const sizeMap = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" } as const;

export const RatingStars = ({ value, size = "md", onChange, className, showValue, count }: Props) => {
  const interactive = !!onChange;
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= Math.round(value);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange?.(n)}
              disabled={!interactive}
              className={cn(
                "p-0.5",
                interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default",
              )}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  filled ? "fill-warning text-warning" : "text-muted-foreground/40",
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-muted-foreground">
          {value.toFixed(1)}{typeof count === "number" && ` (${count})`}
        </span>
      )}
    </div>
  );
};
