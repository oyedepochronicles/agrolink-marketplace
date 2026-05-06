import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Package, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DataTable } from "@/components/dashboard/DataTable";
import { useAdminProducts, useDeleteAdminProduct } from "@/hooks/useAdmin";
import { apiErrorMessage } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/types";

interface Row {
  _id: string;
  title: string;
  category: string;
  price: number;
  farmer: string;
  state: string;
  stock: number;
  raw: Product;
}

const AdminProducts = () => {
  const { t } = useTranslation();
  const { data: products = [], isLoading } = useAdminProducts();
  const del = useDeleteAdminProduct();
  const [confirm, setConfirm] = useState<Product | null>(null);

  const rows = useMemo<Row[]>(() => products.map((p) => ({
    _id: p._id,
    title: p.title || p.name || "—",
    category: p.category ?? "—",
    price: p.price,
    farmer: p.farmer?.name ?? "—",
    state: p.state ?? "—",
    stock: p.stock ?? p.quantity ?? 0,
    raw: p,
  })), [products]);

  const remove = async () => {
    if (!confirm) return;
    try { await del.mutateAsync(confirm._id); toast.success("Product removed"); setConfirm(null); }
    catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "title", header: t("admin.columns.title"), cell: ({ row }) => {
      const p = row.original.raw;
      return (
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
            {p.images?.[0] && <img src={p.images[0]} alt={row.original.title} className="h-full w-full object-cover" loading="lazy" />}
          </div>
          <span className="font-medium">{row.original.title}</span>
        </div>
      );
    }},
    { accessorKey: "category", header: t("admin.columns.category"), cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge> },
    { accessorKey: "price", header: t("admin.columns.price"), cell: ({ row }) => <span className="font-semibold text-primary">{formatNaira(row.original.price)}</span> },
    { accessorKey: "stock", header: t("admin.columns.stock") },
    { accessorKey: "farmer", header: t("admin.columns.farmer") },
    { accessorKey: "state", header: t("auth.state") },
    {
      id: "actions",
      header: t("common.actions"),
      enableSorting: false,
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirm(row.original.raw)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.productsTitle")} description={t("admin.productsDesc")} />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Package className="h-6 w-6" />} title={t("common.noResults")} />
      ) : (
        <DataTable data={rows} columns={columns} searchableKeys={["title", "category", "farmer", "state"]} />
      )}

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this listing?</AlertDialogTitle>
            <AlertDialogDescription>"{confirm?.title}" will be taken down.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.remove")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
