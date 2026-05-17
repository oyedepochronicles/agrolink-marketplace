import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { useAdminOrders } from "@/hooks/useAdmin";
import { formatDate, formatNaira, formatOrderAddress } from "@/lib/format";
import type { Order } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface Row {
  _id: string;
  shortId: string;
  product: string;
  buyer: string;
  farmer: string;
  amount: number;
  payment: string;
  paymentMethod: string;
  delivery: string;
  status: Order["status"];
  date: string;
  rawDate: number;
  address: string;
  raw: Order;
}

const buildRow = (o: Order): Row => ({
  _id: o._id,
  shortId: `#${(o._id ?? "").slice(-6).toUpperCase()}`,
  product: o.product?.title || o.productId?.title || "—",
  buyer: o.buyer?.name || o.buyerId?.name || "—",
  farmer: o.farmer?.name || o.farmerId?.name || "—",
  amount: o.totalAmount ?? o.total ?? (o.amount ?? 0) + (o.deliveryFee ?? 0),
  payment: o.paymentStatus ?? "unpaid",
  paymentMethod: o.paymentMethod ?? "in_app",
  delivery: `${o.deliveryMethod ?? "delivery"} / ${o.deliveryUrgency ?? "standard"}`,
  status: o.status,
  date: formatDate(o.createdAt),
  rawDate: new Date(o.createdAt ?? 0).getTime(),
  address: formatOrderAddress(o.deliveryAddress) || "—",
  raw: o,
});

const AdminOrders = () => {
  const { t } = useTranslation();
  const { data: orders = [], isLoading } = useAdminOrders();
  const rows = useMemo(() => orders.map(buildRow), [orders]);

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "shortId",
        header: t("admin.columns.orderId"),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">
            {row.original.shortId}
          </span>
        ),
      },
      {
        accessorKey: "product",
        header: t("admin.columns.product"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.raw.productId.name}</span>
        ),
      },
      { accessorKey: "buyer", header: t("admin.columns.buyer") },
      { accessorKey: "farmer", header: t("admin.columns.farmer") },
      {
        accessorKey: "amount",
        header: t("admin.columns.amount"),
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatNaira(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "payment",
        header: t("admin.columns.payment"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.payment === "paid"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-warning/30 bg-warning/10 text-warning-foreground"
            }
          >
            {row.original.payment}
          </Badge>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment method",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.paymentMethod.replace("_", " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "delivery",
        header: "Delivery",
        cell: ({ row }) => (
          <span className="capitalize">
            {row.original.delivery.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("admin.columns.status"),
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "rawDate",
        header: t("admin.columns.date"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.date}</span>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.ordersTitle")}
        description={t("admin.ordersDesc")}
      />
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title={t("common.noResults")}
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchableKeys={[
            "shortId",
            "product",
            "buyer",
            "farmer",
            "status",
            "payment",
            "paymentMethod",
            "delivery",
          ]}
        />
      )}
    </div>
  );
};

export default AdminOrders;
