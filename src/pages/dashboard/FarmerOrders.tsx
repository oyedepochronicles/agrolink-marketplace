import { Banknote, Check, Loader2, ShoppingCart, Truck, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { OrderStatusBadge } from "@/components/dashboard/StatusBadge";
import { useFarmerOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { formatDate, formatNaira, formatOrderAddress, initials } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";

const FARMER_OPTIONS: OrderStatus[] = ["paid", "processing", "in_transit", "delivered", "cancelled"];

const productName = (order: Order) => order.product?.title || order.productId?.title || "Order item";
const productUnit = (order: Order) => order.product?.unit || order.productId?.unit || "unit";
const productId = (order: Order) => order.product?._id || order.productId?._id;
const buyerName = (order: Order) => order.buyer?.name || order.buyerId?.name || "Buyer";
const orderTotal = (order: Order) =>
  order.totalAmount ?? order.total ?? (order.amount ?? 0) + (order.deliveryFee ?? 0);

const FarmerOrders = () => {
  const { data: orders = [], isLoading } = useFarmerOrders();
  const update = useUpdateOrderStatus();
  const respond = useRespondToOrder();

  const handleChange = async (id: string, status: OrderStatus) => {
    try {
      await update.mutateAsync({ id, status });
      toast.success("Order updated");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const handleRespond = async (id: string, action: "accept" | "decline") => {
    try {
      await respond.mutateAsync({ id, action });
      toast.success(action === "accept" ? "Order accepted — buyer can now pay" : "Order declined");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Respond to incoming orders, record offline payments, and assign riders." />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="No orders yet"
          description="When buyers purchase your products they'll appear here for you to fulfil."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o._id} className="rounded-2xl p-4 shadow-card">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex flex-1 items-center gap-3 min-w-[220px]">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">{initials(buyerName(o))}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{productName(o)}</p>
                    <p className="text-xs text-muted-foreground">
                      {buyerName(o)} - {o.quantity} x {productUnit(o)} - {formatDate(o.createdAt)}
                    </p>
                  </div>

                <div className="text-right">
                  <p className="font-display text-lg font-extrabold">{formatNaira(orderTotal(o))}</p>
                  <OrderStatusBadge status={o.status} />
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <Select value={o.status} onValueChange={(v) => handleChange(o._id, v as OrderStatus)}>
                    <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FARMER_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" asChild disabled={!productId(o)}>
                    <a href={`/marketplace/product/${productId(o) ?? ""}`} target="_blank" rel="noreferrer">View</a>
                  </Button>
                </div>
              </div>
              {o.deliveryAddress && (
                <p className="mt-3 text-xs text-muted-foreground">Location: {formatOrderAddress(o.deliveryAddress)}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerOrders;
