import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBuyerOrders,
  useCancelOrder,
  useOrderConversation,
} from "@/hooks/useOrders";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatNaira, formatOrderAddress } from "@/lib/format";
import type { Order } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, PackageCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const orderProductName = (order: Order) => {
  return order.productId?.name || "Order item";
};

const orderTotal = (order: Order) =>
  order.totalAmount ??
  order.total ??
  (order.amount ?? 0) + (order.deliveryFee ?? 0);

const orderAddress = (order: Order) => {
  if (!order.deliveryAddress) return "Farm pickup";
  return formatOrderAddress(order.deliveryAddress);
};
const Orders = () => {
  const { data: orders = [], isLoading } = useBuyerOrders();
  const [searchParams] = useSearchParams();
  const navTab = searchParams.get("tab") || "paid";
  const [tab, setTab] = useState(navTab.toLowerCase());

  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const reference =
      params.get("payment_reference") ||
      params.get("reference") ||
      params.get("trxref");
    const orderId = params.get("order_id") || params.get("orderId");
    if (!reference && !orderId) return;

    let cancelled = false;
    const verify = async () => {
      try {
        await api.post("/payments/verify", {
          reference: reference || undefined,
          orderId: orderId || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
        if (!cancelled) {
          toast.success("Payment confirmed");
          setParams(
            (next) => {
              next.delete("payment_reference");
              next.delete("reference");
              next.delete("trxref");
              next.delete("order_id");
              next.delete("orderId");
              return next;
            },
            { replace: true },
          );
        }
      } catch (e) {
        if (!cancelled) toast.error(apiErrorMessage(e));
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [params, queryClient, setParams]);

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">
        Orders
      </h1>
      <p className="text-sm text-muted-foreground">
        Track purchases, payment status, and delivery updates.
      </p>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>
        <TabsContent value="paid" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.filter((r) => r.paymentStatus === "paid").length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<PackageCheck className="h-6 w-6" />}
                title="No paid orders yet"
                description="Your checkout history and order updates will appear here."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {orders
                .filter((r) => r.paymentStatus === "paid")

                .map((order) => (
                  <OrderCard key={order._id} {...order} />
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="unpaid" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.filter((r) => r.paymentStatus === "unpaid").length ===
            0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<PackageCheck className="h-6 w-6" />}
                title="No unpay orders"
                description="Your checkout history and order updates will appear here."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {orders
                .filter((r) => r.paymentStatus === "unpaid")

                .map((order) => (
                  <OrderCard key={order._id} {...order} />
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
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
                <OrderCard key={order._id} {...order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
function OrderCard(order) {
  const cancel = useCancelOrder();
  const orderConversation = useOrderConversation();
  const navigate = useNavigate();
  const openConversation = async (order: Order, recipientId?: string) => {
    try {
      const conversation = await orderConversation.mutateAsync({
        orderId: order._id,
        recipientId,
      });
      const cid = conversation._id ?? conversation.id;
      navigate(`/marketplace/messages${cid ? `?conversation=${cid}` : ""}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const cancelOrder = async (order: Order) => {
    try {
      await cancel.mutateAsync(order._id);
      toast.success("Order cancelled");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };
  return (
    <Card key={order._id} className="rounded-2xl p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{orderProductName(order)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Qty {order.quantity} · {formatDate(order.createdAt)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Order ID: {`#${(order._id ?? "").slice(-6).toUpperCase()}`}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {orderAddress(order)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-extrabold">
            {formatNaira(orderTotal(order))}
          </p>
          <div className="mt-1 flex justify-end gap-1">
            <Badge variant="outline" className="capitalize">
              {order.status}
            </Badge>
            {order.paymentStatus && (
              <Badge
                variant={
                  order.paymentStatus === "paid" ? "default" : "secondary"
                }
                className="capitalize"
              >
                {order.paymentStatus}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => openConversation(order, order.farmerId?._id)}
          disabled={orderConversation.isPending}
          className="gap-1"
        >
          <MessageCircle className="h-4 w-4" /> Message farmer
        </Button>
        {order.riderId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openConversation(order, order.riderId?._id)}
            disabled={orderConversation.isPending}
            className="gap-1"
          >
            <MessageCircle className="h-4 w-4" /> Message rider
          </Button>
        )}
        {order.status !== "cancelled" &&
          order.status !== "completed" &&
          !["picked_up", "in_transit", "delivered"].includes(
            order.deliveryStatus || "pending",
          ) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cancelOrder(order)}
              disabled={cancel.isPending}
              className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" /> Cancel
            </Button>
          )}
      </div>
    </Card>
  );
}

export default Orders;
