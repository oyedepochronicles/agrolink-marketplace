import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, VerificationStatus } from "@/types";

const ORDER_STYLES: Record<OrderStatus, string> = {
  pending: "bg-muted text-foreground",
  accepted: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
  completed: "bg-primary/15 text-primary",
  paid: "bg-primary/10 text-primary",
  processing: "bg-accent/40 text-accent-foreground",
  in_transit: "bg-warning/15 text-warning-foreground",
  delivered: "bg-primary/15 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge variant="outline" className={cn("rounded-full border-transparent capitalize", ORDER_STYLES[status])}>
    {status.replace("_", " ")}
  </Badge>
);

const VERIF_STYLES: Record<VerificationStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground",
  pending_verification: "bg-warning/15 text-warning-foreground",
  approved: "bg-primary/15 text-primary",
  rejected: "bg-destructive/10 text-destructive",
  not_verify: "bg-muted text-muted-foreground",
};

export const VerificationBadge = ({ status }: { status: VerificationStatus }) => (
  <Badge variant="outline" className={cn("rounded-full border-transparent capitalize", VERIF_STYLES[status])}>
    {status}
  </Badge>
);
