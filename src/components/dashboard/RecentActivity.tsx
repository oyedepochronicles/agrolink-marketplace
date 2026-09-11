import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatNaira } from "@/lib/format";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

// Rows come straight from the analytics payload (recentOrders / recentDeliveries),
// which the server returns as loosely-typed records — keep this presentational.
export interface ActivityRow {
  _id?: string | number;
  productName?: string | number;
  buyerName?: string | number;
  amount?: string | number;
  status?: string | number;
  createdAt?: string | number;
  [key: string]: string | number | undefined;
}

const statusTone = (status?: string): string => {
  switch (status) {
    case "completed":
    case "delivered":
      return "border-primary/40 bg-primary/10 text-primary";
    case "cancelled":
    case "rejected":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "pending":
      return "border-warning/40 bg-warning/10 text-warning-foreground";
    default:
      return "border-border bg-secondary text-foreground/70";
  }
};

export const RecentActivity = ({
  title,
  description,
  rows,
  linkTo,
  linkLabel,
  emptyLabel = "Nothing yet.",
}: {
  title: string;
  description?: string;
  rows?: ActivityRow[];
  linkTo: string;
  linkLabel: string;
  emptyLabel?: string;
}) => {
  const items = rows ?? [];

  return (
    <Card className="rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Link
          to={linkTo}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {linkLabel} <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {items.map((row, i) => {
            const status = row.status != null ? String(row.status) : undefined;
            const amount =
              typeof row.amount === "number" ? row.amount : undefined;
            return (
              <li
                key={String(row._id ?? i)}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {row.productName ? String(row.productName) : "Item"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.buyerName ? String(row.buyerName) : "—"}
                    {row.createdAt
                      ? ` • ${formatDate(String(row.createdAt))}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {amount != null && (
                    <span className="font-display text-sm font-extrabold">
                      {formatNaira(amount)}
                    </span>
                  )}
                  {status && (
                    <Badge
                      variant="outline"
                      className={`capitalize ${statusTone(status)}`}
                    >
                      {status.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
