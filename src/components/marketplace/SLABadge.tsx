import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import type { SLAState } from "@/types/batch";
import { Clock, PackageCheck, Sprout, Zap } from "lucide-react";

const STYLES: Record<SLAState, { className: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  READY_NOW:       { className: "bg-primary/15 text-primary border-primary/30",       label: "Ready now",     Icon: PackageCheck },
  EXPRESS_READY:   { className: "bg-accent/30 text-accent-foreground border-accent/40", label: "Express ready", Icon: Zap },
  DELAYED_HARVEST: { className: "bg-warning/15 text-warning-foreground border-warning/30", label: "Pre-harvest",   Icon: Sprout },
  OVERDUE:         { className: "bg-destructive/15 text-destructive border-destructive/30", label: "Overdue",       Icon: Clock },
};

const deriveState = (product: Product): SLAState => {
  if (product.isPreHarvest) return "DELAYED_HARVEST";
  const harvest = product.expectedHarvestDate || product.harvestDate;
  if (harvest && new Date(harvest).getTime() > Date.now() + 24 * 3600 * 1000) {
    return "DELAYED_HARVEST";
  }
  const deadline = (product as { deadlineHours?: number }).deadlineHours;
  if (deadline && deadline <= 12) return "EXPRESS_READY";
  return "READY_NOW";
};

interface Props {
  product?: Product;
  state?: SLAState;
  deadline?: string | null;
  className?: string;
  showLabel?: boolean;
}

export const SLABadge = ({ product, state, deadline, className, showLabel = true }: Props) => {
  const resolved: SLAState =
    state ??
    (deadline && new Date(deadline).getTime() < Date.now() ? "OVERDUE" : product ? deriveState(product) : "READY_NOW");
  const { className: badgeClass, label, Icon } = STYLES[resolved];
  return (
    <Badge variant="outline" className={cn("inline-flex items-center gap-1 rounded-full", badgeClass, className)}>
      <Icon className="h-3 w-3" />
      {showLabel && <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>}
    </Badge>
  );
};
