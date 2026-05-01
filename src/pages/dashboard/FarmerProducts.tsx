import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ProductFormDialog } from "@/components/dashboard/ProductFormDialog";
import { useDeleteProduct, useFarmerProducts } from "@/hooks/useFarmerProducts";
import { formatNaira } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api";
import type { Product } from "@/types";

const FarmerProducts = () => {
  const { data: products = [], isLoading } = useFarmerProducts();
  const del = useDeleteProduct();
  const [editing, setEditing] = useState<Product | undefined>();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const onNew = () => { setEditing(undefined); setOpen(true); };
  const onEdit = (p: Product) => { setEditing(p); setOpen(true); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await del.mutateAsync(confirmDelete._id);
      toast.success("Product deleted");
      setConfirmDelete(null);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My products"
        description="Manage your farm listings — buyers will see them in the marketplace."
        action={<Button onClick={onNew}><Plus className="h-4 w-4" /> New product</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-6 w-6" />}
          title="No products yet"
          description="Create your first listing to start receiving orders from buyers across Nigeria."
          action={<Button className="mt-2" onClick={onNew}><Plus className="h-4 w-4" /> Add product</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p._id} className="overflow-hidden rounded-2xl shadow-card">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 font-semibold">{p.title}</h3>
                  <Badge variant="outline" className="rounded-full">{p.category ?? "—"}</Badge>
                </div>
                <p className="font-display text-lg font-extrabold text-primary">
                  {formatNaira(p.price)} <span className="text-xs font-medium text-muted-foreground">/ {p.unit ?? "unit"}</span>
                </p>
                <p className="text-xs text-muted-foreground">Stock: {p.stock ?? 0} • {p.state ?? "—"}</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmDelete(p)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductFormDialog open={open} onOpenChange={setOpen} product={editing} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" will be removed from the marketplace. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FarmerProducts;
