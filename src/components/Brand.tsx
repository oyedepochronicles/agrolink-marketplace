import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  to?: string;
  variant?: "default" | "light";
  className?: string;
  showWordmark?: boolean;
}

export const Brand = ({ to = "/marketplace", variant = "default", className, showWordmark = true }: Props) => {
  const wordColor = variant === "light" ? "text-white" : "text-foreground";
  const subColor = variant === "light" ? "text-white/70" : "text-muted-foreground";
  return (
    <Link to={to} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow transition-spring group-hover:scale-105">
        <Sprout className="h-5 w-5" strokeWidth={2.5} />
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-base font-extrabold tracking-tight", wordColor)}>
            Phyhan<span className="text-primary-glow">Agro</span>
          </span>
          <span className={cn("mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em]", subColor)}>
            Marketplace
          </span>
        </span>
      )}
    </Link>
  );
};
