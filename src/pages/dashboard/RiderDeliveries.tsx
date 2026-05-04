import { useState } from "react";
import { Loader2, MapPin, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { OrderStatusBadge } from "@/components/dashboard/StatusBadge";
import {
  useAcceptDelivery, useAvailableDeliveries, useRiderDeliveries, useUpdateOrderStatus,
} from "@/hooks/useOrders";
import { formatDate, formatNaira, formatOrderAddress, initials } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "in_transit",
  processing: "in_transit",
  in_transit: "delivered",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  paid: "Mark in transit",
  processing: "Mark in transit",
  in_transit: "Mark delivered",
};

const productName = (order: Order) => order.product?.title || order.productId?.title || "Order item";
const productUnit = (order: Order) => order.product?.unit || order.productId?.unit || "unit";
const buyerName = (order: Order) => order.buyer?.name || order.buyerId?.name || "Buyer";
const orderTotal = (order: Order) =>
  order.totalAmount ?? order.total ?? (order.amount ?? 0) + (order.deliveryFee ?? 0);

const RiderDeliveries = () => {
  const [tab, setTab] = useState("active");
  const available = useAvailableDeliveries();
  const mine = useRiderDeliveries();
  const accept = useAcceptDelivery();
  const update = useUpdateOrderStatus();

  const handleAccept = async (id: string) => {
    try {
      await accept.mutateAsync(id);
      toast.success("Delivery accepted");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const advance = async (o: Order) => {
    const next = NEXT[o.status];
    if (!next) return;
    try {
      await update.mutateAsync({ id: o._id, status: next });
      toast.success(`Marked ${next.replace("_", " ")}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Deliveries" description="Pick up jobs and update status as you ride." />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {mine.isLoading ? <CenterSpin /> : (mine.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="No active deliveries"
              description="Accept a job from the Available tab to get started."
            />
          ) : (
            <div className="space-y-3">
              {(mine.data ?? []).map((o) => (
                <DeliveryCard
                  key={o._id}
                  order={o}
                  action={NEXT[o.status] && (
                    <Button size="sm" onClick={() => advance(o)} disabled={update.isPending}>
                      {NEXT_LABEL[o.status]}
                    </Button>
                  )}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-4">
          {available.isLoading ? <CenterSpin /> : (available.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="No deliveries available"
              description="New jobs in your area will appear here."
            />
          ) : (
            <div className="space-y-3">
              {(available.data ?? []).map((o) => (
                <DeliveryCard
                  key={o._id}
                  order={o}
                  action={
                    <Button size="sm" onClick={() => handleAccept(o._id)} disabled={accept.isPending}>
                      Accept
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const CenterSpin = () => (
  <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
);

const DeliveryCard = ({ order, action }: { order: Order; action?: React.ReactNode }) => (
  <Card className="rounded-2xl p-4 shadow-card">
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex flex-1 items-center gap-3 min-w-[220px]">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary">{initials(buyerName(order))}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold">{productName(order)}</p>
          <p className="text-xs text-muted-foreground">
            {order.quantity} x {productUnit(order)} - {formatDate(order.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-display text-lg font-extrabold">{formatNaira(orderTotal(order))}</p>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="w-full sm:w-auto">{action}</div>
    </div>
    {order.deliveryAddress && (
      <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> {formatOrderAddress(order.deliveryAddress)}
      </p>
    )}
  </Card>
);

export default RiderDeliveries;
