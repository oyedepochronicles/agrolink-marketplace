import { Loader2, PackageCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useBuyerOrders } from "@/hooks/useOrders";
import { formatDate, formatNaira, formatOrderAddress } from "@/lib/format";
import type { Order } from "@/types";

const orderProductName = (order: Order) =>
  order.product?.title || order.productId?.title || "Order item";

const orderTotal = (order: Order) =>
  order.totalAmount ?? order.total ?? (order.amount ?? 0) + (order.deliveryFee ?? 0);

const orderAddress = (order: Order) => {
  if (!order.deliveryAddress) return "Farm pickup";
  return formatOrderAddress(order.deliveryAddress);
};

const Orders = () => {
  const { data: orders = [], isLoading } = useBuyerOrders();

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">Orders</h1>
      <p className="text-sm text-muted-foreground">Track purchases, payment status, and delivery updates.</p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<PackageCheck className="h-6 w-6" />}
            title="No orders yet"
            description="Your checkout history and order updates will appear here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Card key={order._id} className="rounded-2xl p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{orderProductName(order)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Qty {order.quantity} · {formatDate(order.createdAt)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{orderAddress(order)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-extrabold">{formatNaira(orderTotal(order))}</p>
                  <div className="mt-1 flex justify-end gap-1">
                    <Badge variant="outline" className="capitalize">{order.status}</Badge>
                    {order.paymentStatus && (
                      <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"} className="capitalize">
                        {order.paymentStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
