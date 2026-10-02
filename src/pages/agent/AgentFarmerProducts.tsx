import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAgentAssignments,
  useAgentFarmerOrders,
  useAgentFarmerProducts,
  useCreateFarmerProduct,
  useSetFarmerProductStatus,
  useUpdateFarmerProduct,
} from "@/hooks/useAgentPortal";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { refId, refLabel } from "@/types/agents";
import type { Order, Product } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Loader2, MoreHorizontal, Plus, UserCog } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

const PRODUCT_STATUSES: NonNullable<Product["status"]>[] = [
  "available",
  "reserved",
  "sold",
  "expired",
];

const STATUS_STYLES: Record<string, string> = {
  available: "rounded-full border-transparent bg-primary/10 text-primary",
  reserved: "rounded-full border-transparent bg-amber-500/10 text-amber-600",
  sold: "rounded-full border-transparent bg-muted text-muted-foreground",
  expired: "rounded-full border-transparent bg-destructive/10 text-destructive",
};

const todayInput = () => new Date().toISOString().slice(0, 10);

const AgentFarmerProducts = () => {
  const { farmerId = "" } = useParams();
  const { data: assignments } = useAgentAssignments();
  const {
    data: products,
    isLoading,
    error,
  } = useAgentFarmerProducts(farmerId, !!farmerId);

  const createProduct = useCreateFarmerProduct(farmerId);
  const updateProduct = useUpdateFarmerProduct(farmerId);
  const setStatus = useSetFarmerProductStatus(farmerId);

  // Resolve a display name for the farmer from the active assignment.
  const farmerLabel = useMemo(() => {
    const match = (assignments ?? []).find(
      (a) => a.status === "active" && refId(a.farmerId) === farmerId,
    );
    return match ? refLabel(match.farmerId) : "this farmer";
  }, [assignments, farmerId]);

  // --- create ---
  const emptyForm = {
    name: "",
    category: "",
    price: "",
    quantity: "",
    unit: "kg",
    description: "",
    harvestDate: todayInput(),
  };
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.price || !form.quantity || !form.unit.trim()) {
      return toast.error("Name, category, price, quantity and unit are required");
    }
    try {
      await createProduct.mutateAsync({
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
        unit: form.unit.trim(),
        description: form.description.trim() || undefined,
        harvestDate: form.harvestDate || undefined,
      });
      toast.success("Listing created on behalf of the farmer");
      setCreateOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  // --- edit price/quantity ---
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ price: "", quantity: "" });

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setEditForm({
      price: String(product.price ?? ""),
      quantity: String(product.quantity ?? ""),
    });
  };

  const submitEdit = async () => {
    if (!editProduct) return;
    try {
      await updateProduct.mutateAsync({
        id: editProduct._id,
        price: Number(editForm.price),
        quantity: Number(editForm.quantity),
      });
      toast.success("Listing updated");
      setEditProduct(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const changeStatus = async (product: Product, status: NonNullable<Product["status"]>) => {
    try {
      await setStatus.mutateAsync({ id: product._id, status });
      toast.success(`Marked ${status}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const productColumns: ColumnDef<Product, unknown>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <div className="flex items-center gap-2">
            <p className="font-medium">{row.original.name}</p>
            {row.original.createdByAgent && (
              <Badge variant="outline" className="rounded-full text-[10px]">
                <UserCog className="mr-1 h-3 w-3" /> Agent-managed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{row.original.category}</p>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => <span>{formatNaira(row.original.price)}</span>,
    },
    {
      id: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.quantity ?? 0} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={STATUS_STYLES[row.original.status ?? ""] ?? "rounded-full"}>
          {row.original.status ?? "—"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Product actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(product)}>Edit price / quantity</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Set status
              </DropdownMenuLabel>
              {PRODUCT_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  disabled={product.status === s || setStatus.isPending}
                  onClick={() => changeStatus(product, s)}
                >
                  <span className="capitalize">{s}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="rounded-full">
        <Link to="/agent/farmers">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to farmers
        </Link>
      </Button>

      {/* Prominent on-behalf banner — the agent is acting for the farmer, not as themselves. */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
        <p className="flex items-center gap-2 font-semibold">
          <UserCog className="h-4 w-4" /> Acting on behalf of {farmerLabel}
        </p>
        <p className="mt-1 text-primary/80">
          Listings you create or edit here belong to the farmer and are recorded against your agent
          account for traceability.
        </p>
      </div>

      <PageHeader
        title="Manage listings"
        description="Create and manage this farmer's listings and view their orders."
        action={
          <Button className="rounded-full" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New listing
          </Button>
        }
      />

      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {apiErrorMessage(error)}
        </p>
      ) : isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : (
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <DataTable
              data={products ?? []}
              columns={productColumns}
              searchPlaceholder="Search listings"
              searchableKeys={["name", "category"]}
              emptyMessage="No listings yet. Create one on the farmer's behalf."
            />
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <FarmerOrders farmerId={farmerId} />
          </TabsContent>
        </Tabs>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New listing for {farmerLabel}</DialogTitle>
            <DialogDescription>
              This listing is created on behalf of the farmer and stays owned by them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Product name</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-category">Category</Label>
              <Input
                id="p-category"
                placeholder="e.g. Feed, Grains, Vegetables"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price (₦)</Label>
                <Input
                  id="p-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-qty">Quantity</Label>
                <Input
                  id="p-qty"
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-unit">Unit</Label>
                <Input
                  id="p-unit"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-harvest">Harvest date</Label>
              <Input
                id="p-harvest"
                type="date"
                value={form.harvestDate}
                onChange={(e) => setForm((f) => ({ ...f, harvestDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description (optional)</Label>
              <Textarea
                id="p-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={submitCreate} disabled={createProduct.isPending}>
              {createProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit {editProduct?.name}</DialogTitle>
            <DialogDescription>Update the price and available quantity.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="e-price">Price (₦)</Label>
              <Input
                id="e-price"
                type="number"
                min={0}
                value={editForm.price}
                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-qty">Quantity</Label>
              <Input
                id="e-qty"
                type="number"
                min={0}
                value={editForm.quantity}
                onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditProduct(null)}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={submitEdit} disabled={updateProduct.isPending}>
              {updateProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Read-only orders for the assigned farmer (on-behalf order mutation is Phase 5). */
const FarmerOrders = ({ farmerId }: { farmerId: string }) => {
  const { data: orders, isLoading, error } = useAgentFarmerOrders(farmerId, !!farmerId);

  const columns: ColumnDef<Order, unknown>[] = [
    {
      id: "product",
      header: "Product",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.productId?.name ?? "—"}</span>
      ),
    },
    {
      id: "buyer",
      header: "Buyer",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.buyerId?.name ?? "—"}</span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) => <span>{formatNaira(row.original.amount ?? row.original.total ?? 0)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-full capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];

  if (isLoading) return <Skeleton className="h-56 w-full rounded-2xl" />;
  if (error)
    return (
      <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        {apiErrorMessage(error)}
      </p>
    );

  return (
    <DataTable
      data={orders ?? []}
      columns={columns}
      searchPlaceholder="Search orders"
      emptyMessage="No orders for this farmer yet."
    />
  );
};

export default AgentFarmerProducts;
