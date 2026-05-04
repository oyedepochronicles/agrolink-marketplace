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
import { OfflinePaymentDialog } from "@/components/dashboard/OfflinePaymentDialog";
import { AssignRiderDialog } from "@/components/dashboard/AssignRiderDialog";
import {
  useFarmerOrders, useRespondToOrder, useUpdateOrderStatus,
} from "@/hooks/useOrders";
import { formatDate, formatNaira, initials } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api";
import type { OrderStatus } from "@/types";

const FARMER_OPTIONS: OrderStatus[] = ["paid", "processing", "in_transit", "delivered", "cancelled"];

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
          {orders.map((o) => {
            const isPending = o.status === "pending";
            const isPaid = o.status === "paid" || o.status === "processing" || o.status === "in_transit";
            return (
              <Card key={o._id} className="rounded-2xl p-4 shadow-card">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex flex-1 items-center gap-3 min-w-[220px]">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">{initials(o.buyer?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{o.product?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.buyer?.name} • {o.quantity} × {o.product?.unit ?? "unit"} • {formatDate(o.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-lg font-extrabold">{formatNaira(o.totalAmount)}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>

                {o.deliveryAddress && (
                  <p className="mt-3 text-xs text-muted-foreground">📍 {o.deliveryAddress}</p>
                )}
                {o.rider && (
                  <p className="mt-1 text-xs text-muted-foreground">🛵 Rider: <span className="font-medium text-foreground">{o.rider.name}</span></p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {isPending && (
                    <>
                      <Button size="sm" onClick={() => handleRespond(o._id, "accept")} disabled={respond.isPending}>
                        <Check className="mr-1 h-4 w-4" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRespond(o._id, "decline")} disabled={respond.isPending}>
                        <X className="mr-1 h-4 w-4" /> Decline
                      </Button>
                      <OfflinePaymentDialog
                        order={o}
                        trigger={
                          <Button size="sm" variant="secondary">
                            <Banknote className="mr-1 h-4 w-4" /> Mark as paid (offline)
                          </Button>
                        }
                      />
                    </>
                  )}

                  {!isPending && (
                    <Select value={o.status} onValueChange={(v) => handleChange(o._id, v as OrderStatus)}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FARMER_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {isPaid && (
                    <AssignRiderDialog
                      order={o}
                      trigger={
                        <Button size="sm" variant="outline">
                          <Truck className="mr-1 h-4 w-4" /> {o.rider ? "Reassign rider" : "Assign rider"}
                        </Button>
                      }
                    />
                  )}

                  <Button variant="ghost" size="sm" asChild className="ml-auto">
                    <a href={`/marketplace/product/${o.product?._id}`} target="_blank" rel="noreferrer">View product</a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FarmerOrders;
