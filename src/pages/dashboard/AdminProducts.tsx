import { useState } from "react";
import { Loader2, Package, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAdminProducts, useDeleteAdminProduct } from "@/hooks/useAdmin";
import { formatNaira } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api";
import type { Product } from "@/types";

const AdminProducts = () => {
  const { data: products = [], isLoading } = useAdminProducts();
  const del = useDeleteAdminProduct();
  const [confirm, setConfirm] = useState<Product | null>(null);

  const remove = async () => {
    if (!confirm) return;
    try { await del.mutateAsync(confirm._id); toast.success("Product removed"); setConfirm(null); }
    catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Listings" description="Moderate marketplace products." />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : products.length === 0 ? (
        <EmptyState icon={<Package className="h-6 w-6" />} title="No products yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p._id} className="overflow-hidden rounded-2xl shadow-card">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" loading="lazy" /> :
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 font-semibold">{p.title}</h3>
                  <Badge variant="outline">{p.category ?? "—"}</Badge>
                </div>
                <p className="font-display text-lg font-extrabold text-primary">{formatNaira(p.price)}</p>
                <p className="text-xs text-muted-foreground">By {p.farmer?.name ?? "—"} • {p.state ?? "—"}</p>
                <Button variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirm(p)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this listing?</AlertDialogTitle>
            <AlertDialogDescription>"{confirm?.title}" will be taken down from the marketplace.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
