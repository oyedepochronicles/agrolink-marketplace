import { AssignRiderDialog } from "@/components/dashboard/AssignRiderDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { OfflinePaymentDialog } from "@/components/dashboard/OfflinePaymentDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/dashboard/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFarmerOrders,
  useOrderConversation,
  useRespondToOrder,
  useUpdateOrderStatus,
} from "@/hooks/useOrders";
import { apiErrorMessage } from "@/lib/api";
import {
  formatDate,
  formatNaira,
  formatOrderAddress,
  initials,
} from "@/lib/format";
import type { Order, OrderStatus } from "@/types";
import {
  Banknote,
  Check,
  Loader2,
  MessageCircle,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const FARMER_OPTIONS: OrderStatus[] = [
  "accepted",
  "ready_for_pickup",
  "delivered",
  "cancelled",
];

const productName = (order: Order) =>
  order.product?.title || order.productId?.name || "Order item";
const productUnit = (order: Order) =>
  order.product?.unit || order.productId?.unit || "unit";
const productId = (order: Order) => order.product?._id || order.productId?._id;
const buyerName = (order: Order) =>
  order.buyer?.name || order.buyerId?.name || "Buyer";
const orderTotal = (order: Order) =>
  order.totalAmount ??
  order.total ??
  (order.amount ?? 0) + (order.deliveryFee ?? 0);

const FarmerOrders = () => {
  const { data: orders = [], isLoading } = useFarmerOrders();
  const [searchParams] = useSearchParams();
  const navTab = searchParams.get("tab") || "active";
  const [tab, setTab] = useState(navTab.toLowerCase());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Respond to incoming orders, record offline payments, and assign riders."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="overflow-y-auto">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Canceled</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.filter(
              (r) =>
                r.status !== "delivered" &&
                r.status !== "cancelled" &&
                r.status !== "rejected",
            ).length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<ShoppingCart className="h-6 w-6" />}
                title="No orders yet"
                description="When buyers purchase your products they'll appear here for you to fulfil."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {orders
                .filter(
                  (r) =>
                    r.status !== "delivered" &&
                    r.status !== "cancelled" &&
                    r.status !== "rejected",
                )
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((o) => (
                  <FarmerOrdersCard key={o._id} {...o} />
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="delivered" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.filter((r) => r.status === "delivered").length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<ShoppingCart className="h-6 w-6" />}
                title="No orders yet"
                description="When buyers purchase your products they'll appear here for you to fulfil."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {orders
                .filter((r) => r.status === "delivered")
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((o) => (
                  <FarmerOrdersCard key={o._id} {...o} />
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="cancelled" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.filter(
              (r) => r.status === "cancelled" || r.status === "rejected",
            ).length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<ShoppingCart className="h-6 w-6" />}
                title="No orders yet"
                description="When buyers purchase your products they'll appear here for you to fulfil."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {orders
                .filter(
                  (r) => r.status === "cancelled" || r.status === "rejected",
                )
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((o) => (
                  <FarmerOrdersCard key={o._id} {...o} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

function FarmerOrdersCard(o) {
  const respond = useRespondToOrder();
  const update = useUpdateOrderStatus();
  const orderConversation = useOrderConversation();
  const navigate = useNavigate();
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
      toast.success(
        action === "accept"
          ? "Order accepted — buyer can now pay"
          : "Order declined",
      );
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };
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
  const isPending = o.status === "pending";
  const canRecordOffline =
    o.status === "pending" || o.paymentStatus === "unpaid";
  const canAssignRider =
    o.paymentStatus === "paid" &&
    ["accepted", "ready_for_pickup", "pending"].includes(o.status) &&
    o.deliveryMethod !== "pickup";
  return (
    <Card key={o._id} className="rounded-2xl p-4 shadow-card">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-1 items-center gap-3 min-w-[220px]">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials(buyerName(o))}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{productName(o)}</p>
            <p className="text-xs text-muted-foreground">
              {buyerName(o)} • {o.quantity} {productUnit(o)} •{" "}
              {formatDate(o.createdAt)}
            </p>
            {o.rider && (
              <p className="text-xs text-muted-foreground">
                Rider:{" "}
                <span className="font-medium text-foreground">
                  {o.rider.name}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="font-display text-lg font-extrabold">
            {formatNaira(orderTotal(o))}
          </p>
          <OrderStatusBadge status={o.status} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isPending ? (
          <>
            <Button
              size="sm"
              onClick={() => handleRespond(o._id, "accept")}
              disabled={respond.isPending}
              className="gap-1"
            >
              <Check className="h-4 w-4" /> Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRespond(o._id, "decline")}
              disabled={respond.isPending}
              className="gap-1"
            >
              <X className="h-4 w-4" /> Decline
            </Button>
          </>
        ) : (
          <Select
            value={o.status}
            onValueChange={(v) => handleChange(o._id, v as OrderStatus)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FARMER_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {canRecordOffline && (
          <OfflinePaymentDialog
            order={o}
            trigger={
              <Button size="sm" variant="outline" className="gap-1">
                <Banknote className="h-4 w-4" /> Record offline payment
              </Button>
            }
          />
        )}

        {canAssignRider && !o.riderId && (
          <AssignRiderDialog
            order={o}
            trigger={
              <Button size="sm" variant="outline" className="gap-1">
                <Truck className="h-4 w-4" />{" "}
                {o.rider ? "Reassign rider" : "Assign rider"}
              </Button>
            }
          />
        )}

        <Button variant="ghost" size="sm" asChild disabled={!productId(o)}>
          <a
            href={`/marketplace/product/${productId(o) ?? ""}`}
            target="_blank"
            rel="noreferrer"
          >
            View product
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openConversation(o, o.buyerId?._id)}
          disabled={orderConversation.isPending}
          className="gap-1"
        >
          <MessageCircle className="h-4 w-4" /> Message buyer
        </Button>
        {o.riderId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openConversation(o, o.riderId?._id)}
            disabled={orderConversation.isPending}
            className="gap-1"
          >
            <MessageCircle className="h-4 w-4" /> Message rider
          </Button>
        )}
      </div>

      {o.deliveryAddress && (
        <p className="mt-3 text-xs text-muted-foreground">
          Delivery: {formatOrderAddress(o.deliveryAddress)}
        </p>
      )}
    </Card>
  );
}
export default FarmerOrders;
