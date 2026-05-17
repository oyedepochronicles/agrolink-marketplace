import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProductFormDialog } from "@/components/dashboard/ProductFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteProduct,
  useFarmerProducts,
  useUpdateProductStatus,
} from "@/hooks/useFarmerProducts";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type ProductStatus = NonNullable<Product["status"]>;
type AdminStatus = NonNullable<Product["adminStatus"]>;

interface Row {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  status: ProductStatus;
  adminStatus: AdminStatus;
  harvest: string;
  preHarvest: string;
  location: string;
  raw: Product;
}

const STATUS_OPTIONS: ProductStatus[] = ["available", "reserved", "sold", "expired"];

const STATUS_STYLES: Record<ProductStatus, string> = {
  available: "bg-primary/15 text-primary",
  reserved: "bg-warning/15 text-warning-foreground",
  sold: "bg-muted text-muted-foreground",
  expired: "bg-destructive/10 text-destructive",
};

const ADMIN_STATUS_STYLES: Record<AdminStatus, string> = {
  active: "bg-primary/15 text-primary",
  inactive: "bg-destructive/10 text-destructive",
};

const ProductStatusBadge = ({ status }: { status: ProductStatus }) => (
  <Badge
    variant="outline"
    className={cn("rounded-full border-transparent capitalize", STATUS_STYLES[status])}
  >
    {status}
  </Badge>
);

const AdminStatusBadge = ({ status }: { status: AdminStatus }) => (
  <Badge
    variant="outline"
    className={cn("rounded-full border-transparent capitalize", ADMIN_STATUS_STYLES[status])}
  >
    {status}
  </Badge>
);

const FarmerProducts = () => {
  const { data: products = [], isLoading } = useFarmerProducts();
  const del = useDeleteProduct();
  const updateStatus = useUpdateProductStatus();
  const [editing, setEditing] = useState<Product | undefined>();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      products.map((p) => ({
        _id: p._id,
        title: p.title || p.name || "-",
        description: p.description || "-",
        category: p.category || "-",
        price: p.price,
        unit: p.unit || "unit",
        stock: p.stock ?? p.quantity ?? 0,
        status: p.status || "available",
        adminStatus: p.adminStatus || "active",
        harvest: formatDate(p.expectedHarvestDate || p.harvestDate) || "-",
        preHarvest: p.isPreHarvest ? "Pre-harvest" : "Harvested",
        location:
          p.location?.fullAddress ||
          [p.location?.city, p.location?.lga, p.location?.state || p.state]
            .filter(Boolean)
            .join(", ") ||
          "-",
        raw: p,
      })),
    [products],
  );

  const onNew = () => {
    setEditing(undefined);
    setOpen(true);
  };

  const onEdit = (product: Product) => {
    setEditing(product);
    setOpen(true);
  };

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

  const setStatus = useCallback(async (product: Product, status: ProductStatus) => {
    try {
      await updateStatus.mutateAsync({ id: product._id, status });
      toast.success(`Product marked ${status}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }, [updateStatus]);

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Product",
        cell: ({ row }) => {
          const product = row.original.raw;
          return (
            <div className="flex min-w-[220px] items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={row.original.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{row.original.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.description}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {formatNaira(row.original.price)}
          </span>
        ),
      },
      { accessorKey: "unit", header: "Unit" },
      { accessorKey: "stock", header: "Stock" },
      {
        accessorKey: "status",
        header: "Inventory status",
        cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "adminStatus",
        header: "Admin status",
        cell: ({ row }) => <AdminStatusBadge status={row.original.adminStatus} />,
      },
      { accessorKey: "preHarvest", header: "Harvest type" },
      { accessorKey: "harvest", header: "Harvest date" },
      { accessorKey: "location", header: "Location" },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${row.original.title}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(row.original.raw)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuLabel>Set status</DropdownMenuLabel>
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuItem
                  key={status}
                  className="capitalize"
                  disabled={updateStatus.isPending}
                  onClick={() => setStatus(row.original.raw, status)}
                >
                  {status}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmDelete(row.original.raw)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [setStatus, updateStatus.isPending],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My products"
        description="Manage your farm listings. Buyers will see available products in the marketplace."
        action={
          <Button onClick={onNew}>
            <Plus className="h-4 w-4" /> New product
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-6 w-6" />}
          title="No products yet"
          description="Create your first listing to start receiving orders from buyers across Nigeria."
          action={
            <Button className="mt-2" onClick={onNew}>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          }
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchableKeys={["title", "description", "category", "status", "adminStatus", "location"]}
          pageSize={10}
        />
      )}

      <ProductFormDialog open={open} onOpenChange={setOpen} product={editing} />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title || confirmDelete?.name}" will be removed from the marketplace.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FarmerProducts;
