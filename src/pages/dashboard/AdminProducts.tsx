import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAdminProducts,
  useDeleteAdminProduct,
  useUpdateAdminProductAdminStatus,
} from "@/hooks/useAdmin";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreVertical, Package, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type ProductStatus = NonNullable<Product["status"]>;
type AdminStatus = NonNullable<Product["adminStatus"]>;

interface Row {
  _id: string;
  title: string;
  category: string;
  price: number;
  farmer: string;
  state: string;
  stock: number;
  harvest: string;
  availability: string;
  status: ProductStatus;
  adminStatus: AdminStatus;
  raw: Product;
}

const ADMIN_STATUS_OPTIONS: AdminStatus[] = ["active", "inactive"];

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

const StatusBadge = ({ status }: { status: ProductStatus }) => (
  <Badge
    variant="outline"
    className={cn(
      "rounded-full border-transparent capitalize",
      STATUS_STYLES[status],
    )}
  >
    {status}
  </Badge>
);

const AdminStatusBadge = ({ status }: { status: AdminStatus }) => (
  <Badge
    variant="outline"
    className={cn(
      "rounded-full border-transparent capitalize",
      ADMIN_STATUS_STYLES[status],
    )}
  >
    {status}
  </Badge>
);

const Detail = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div>
    <p className="text-xs font-medium uppercase text-muted-foreground">
      {label}
    </p>
    <div className="mt-1 text-sm">{value || "-"}</div>
  </div>
);

const AdminProducts = () => {
  const { t } = useTranslation();
  const { data: products = [], isLoading } = useAdminProducts();
  const del = useDeleteAdminProduct();
  const updateAdminStatus = useUpdateAdminProductAdminStatus();
  const [confirm, setConfirm] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      products.map((p) => ({
        _id: p._id,
        title: p.title || p.name || "-",
        category: p.category ?? "-",
        price: p.price,
        farmer: p.farmer?.name ?? "-",
        state: p.state ?? p.location?.state ?? "-",
        stock: p.stock ?? p.quantity ?? 0,
        harvest: formatDate(p.expectedHarvestDate || p.harvestDate) || "-",
        availability: p.isPreHarvest ? "Pre-harvest" : "Harvested",
        status: p.status || "available",
        adminStatus: p.adminStatus || "active",
        raw: p,
      })),
    [products],
  );

  const remove = async () => {
    if (!confirm) return;
    try {
      await del.mutateAsync(confirm._id);
      toast.success("Product removed");
      setConfirm(null);
      setSelected((current) => (current?._id === confirm._id ? null : current));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const setAdminStatus = useCallback(
    async (product: Product, adminStatus: AdminStatus) => {
      try {
        await updateAdminStatus.mutateAsync({ id: product._id, adminStatus });
        toast.success(`Product marked ${adminStatus}`);
        setSelected((current) =>
          current?._id === product._id ? { ...current, adminStatus } : current,
        );
      } catch (e) {
        toast.error(apiErrorMessage(e));
      }
    },
    [updateAdminStatus],
  );

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("admin.columns.title"),
        cell: ({ row }) => {
          const p = row.original.raw;
          return (
            <div className="flex min-w-[220px] items-center gap-2">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={row.original.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <span className="truncate font-medium">{row.original.title}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: t("admin.columns.category"),
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.category}</Badge>
        ),
      },
      {
        accessorKey: "price",
        header: t("admin.columns.price"),
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {formatNaira(row.original.price)}
          </span>
        ),
      },
      { accessorKey: "stock", header: t("admin.columns.stock") },
      {
        accessorKey: "adminStatus",
        header: "Admin status",
        cell: ({ row }) => (
          <AdminStatusBadge status={row.original.adminStatus} />
        ),
      },
      {
        accessorKey: "status",
        header: "Inventory status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "availability",
        header: "Availability",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.availability}</Badge>
        ),
      },
      { accessorKey: "harvest", header: "Harvest date" },
      { accessorKey: "farmer", header: t("admin.columns.farmer") },
      { accessorKey: "state", header: t("auth.state") },
      {
        id: "actions",
        header: t("common.actions"),
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(event) => event.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${row.original.title}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenuItem onClick={() => setSelected(row.original.raw)}>
                View details
              </DropdownMenuItem>
              <DropdownMenuLabel>Admin status</DropdownMenuLabel>
              {ADMIN_STATUS_OPTIONS.map((status) => (
                <DropdownMenuItem
                  key={status}
                  className="capitalize"
                  disabled={updateAdminStatus.isPending}
                  onClick={() => setAdminStatus(row.original.raw, status)}
                >
                  {status}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirm(row.original.raw)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [setAdminStatus, t, updateAdminStatus.isPending],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.productsTitle")}
        description={t("admin.productsDesc")}
      />
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={t("common.noResults")}
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchableKeys={[
            "title",
            "category",
            "farmer",
            "state",
            "status",
            "adminStatus",
          ]}
          onRowClick={(row) => setSelected(row.raw)}
        />
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl rounded-xl">
          <DialogHeader>
            <DialogTitle>{selected?.title || selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.description ||
                "Product details and moderation controls."}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                  {selected.images?.[0] ? (
                    <img
                      src={selected.images[0]}
                      alt={selected.title || selected.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Detail
                    label="Price"
                    value={`${formatNaira(selected.price)} / ${selected.unit || "unit"}`}
                  />
                  <Detail
                    label="Admin status"
                    value={
                      <AdminStatusBadge
                        status={selected.adminStatus || "active"}
                      />
                    }
                  />
                  <Detail
                    label="Inventory status"
                    value={
                      <StatusBadge status={selected.status || "available"} />
                    }
                  />
                  <Detail
                    label="Stock"
                    value={selected.stock ?? selected.quantity ?? 0}
                  />
                  <Detail label="Category" value={selected.category} />
                  <Detail
                    label="Harvest date"
                    value={formatDate(
                      selected.expectedHarvestDate || selected.harvestDate,
                    )}
                  />
                  <Detail
                    label="Location"
                    value={
                      selected.location?.fullAddress ||
                      selected.state ||
                      selected.location?.state
                    }
                  />
                  <Detail label="Farmer" value={selected.farmer?.name} />
                  <Detail
                    label="Created"
                    value={formatDate(selected.createdAt)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {ADMIN_STATUS_OPTIONS.map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    className="capitalize"
                    onClick={() => setAdminStatus(selected, status)}
                    disabled={updateAdminStatus.isPending}
                  >
                    Mark {status}
                  </Button>
                ))}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirm(selected)}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirm?.title || confirm?.name}" will be taken down.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
