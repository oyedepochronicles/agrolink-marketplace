import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBuyerParentOrders } from "@/hooks/useBatchOrders";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import type { ParentOrder } from "@/types/batch";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, PackageCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const batchLabel = (order: ParentOrder) => {
  const count = order.batches?.length ?? 0;
  return `${count} batch${count === 1 ? "" : "es"}`;
};

const Orders = () => {
  const { data: orders = [], isLoading } = useBuyerParentOrders();
  const [searchParams] = useSearchParams();
  const navTab = searchParams.get("tab") || "paid";
  const [tab, setTab] = useState(navTab.toLowerCase());
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const reference =
      params.get("payment_reference") ||
      params.get("reference") ||
      params.get("trxref");
    const parentOrderId =
      params.get("parent_order_id") ||
      params.get("parentOrderId") ||
      params.get("order_id") ||
      params.get("orderId");
    if (!reference && !parentOrderId) return;

    let cancelled = false;
    const verify = async () => {
      try {
        await api.post("/payments/verify", {
          reference: reference || undefined,
          parentOrderId: parentOrderId || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ["parent-orders"] });
        if (!cancelled) {
          toast.success("Payment confirmed");
          if (parentOrderId) {
            navigate(`/marketplace/orders/${parentOrderId}`);
          }
          setParams(
            (next) => {
              next.delete("payment_reference");
              next.delete("reference");
              next.delete("trxref");
              next.delete("order_id");
              next.delete("orderId");
              next.delete("parent_order_id");
              next.delete("parentOrderId");
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
  }, [params, queryClient, setParams, navigate]);

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">
        Orders
      </h1>
      <p className="text-sm text-muted-foreground">
        Unified checkout — each order may split into multiple delivery batches.
      </p>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="history">All orders</TabsTrigger>
        </TabsList>
        <TabsContent value="paid" className="mt-4">
          <OrderList
            isLoading={isLoading}
            orders={orders.filter((o) => o.paymentStatus === "paid")}
            emptyTitle="No paid orders yet"
          />
        </TabsContent>
        <TabsContent value="unpaid" className="mt-4">
          <OrderList
            isLoading={isLoading}
            orders={orders.filter((o) => o.paymentStatus !== "paid")}
            emptyTitle="No unpaid orders"
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <OrderList
            isLoading={isLoading}
            orders={orders}
            emptyTitle="No orders yet"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const OrderList = ({
  isLoading,
  orders,
  emptyTitle,
}: {
  isLoading: boolean;
  orders: ParentOrder[];
  emptyTitle: string;
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={<PackageCheck className="h-6 w-6" />}
          title={emptyTitle}
          description="Your checkout history and batch tracking will appear here."
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {orders.map((order) => (
        <Card
          key={order._id}
          className="cursor-pointer rounded-2xl p-4 shadow-card transition-base hover:border-primary/40"
          onClick={() => navigate(`/marketplace/orders/${order._id}`)}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(order.createdAt)} · {batchLabel(order)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {order.batches?.slice(0, 3).map((b) => (
                  <Badge key={b._id} variant="outline" className="text-xs capitalize">
                    {b.name || b.type}: {b.status.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-extrabold">
                {formatNaira(order.summary.grandTotal)}
              </p>
              <div className="mt-1 flex justify-end gap-1">
                <Badge variant="outline" className="capitalize">
                  {order.status.replace("_", " ")}
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
          {order.batches?.some((b) => b.status === "in_transit") && (
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
              <Truck className="h-3 w-3" /> Delivery in progress
            </p>
          )}
        </Card>
      ))}
    </div>
  );
};

export default Orders;
