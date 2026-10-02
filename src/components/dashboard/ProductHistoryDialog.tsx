import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useProductHistory } from "@/hooks/useFarmerProducts";
import { formatDate } from "@/lib/format";
import type { Product } from "@/types";
import { Loader2 } from "lucide-react";

interface Props {
  product?: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fmtValue = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

// Read-only audit trail for a product. The query only fires while the dialog is
// open (id gated on `open`) so closed rows don't each hold an idle request.
export const ProductHistoryDialog = ({ product, open, onOpenChange }: Props) => {
  const { data: changes = [], isLoading } = useProductHistory(
    open ? product?._id : undefined,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change history</DialogTitle>
          <DialogDescription>
            Every price, stock and status change for "
            {product?.title || product?.name}".
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : changes.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No changes recorded yet.
          </p>
        ) : (
          <ol className="space-y-3">
            {changes.map((c) => (
              <li
                key={c._id}
                className="rounded-xl border border-border bg-card p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="capitalize">
                    {c.field}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="mt-2">
                  <span className="text-muted-foreground line-through">
                    {fmtValue(c.oldValue)}
                  </span>
                  <span className="mx-2">→</span>
                  <span className="font-semibold">{fmtValue(c.newValue)}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.actorId?.name || c.actorRole || c.source || "system"}
                  {c.reason ? ` · ${c.reason}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
};
