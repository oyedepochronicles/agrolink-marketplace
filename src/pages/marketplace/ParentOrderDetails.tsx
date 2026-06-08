import { EmptyState } from "@/components/dashboard/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useParentOrder } from "@/hooks/useBatchOrders";
import { useOrderConversation } from "@/hooks/useOrders";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatNaira, initials } from "@/lib/format";
import type { Batch, FarmerGroup } from "@/types/batch";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Truck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const ParentOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: parent, isLoading } = useParentOrder(id);

  return (
    <div className="container max-w-4xl py-8">
      <Link
        to="/marketplace/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !parent ? (
        <div className="mt-6">
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Order not available"
            description="We couldn't load this order yet. Please check back shortly."
          />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold md:text-3xl">
                Order #{parent._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-muted-foreground">
                Placed {formatDate(parent.createdAt)} · {parent.batches.length}{" "}
                batch
                {parent.batches.length === 1 ? "" : "es"}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {parent.status.replace("_", " ")}
            </Badge>
          </div>

          <Card className="mt-6 rounded-2xl p-5 shadow-card">
            <h2 className="font-semibold">Summary</h2>
            <div className="mt-3 space-y-1 text-sm">
              <Row
                label="Subtotal"
                value={formatNaira(parent.summary.subtotal)}
              />
              <Row
                label="Delivery"
                value={formatNaira(
                  parent.summary.consolidatedDeliveryFee ??
                    parent.summary.deliveryFee,
                )}
              />
              {parent.summary.serviceFee != null && (
                <Row
                  label="Service fee"
                  value={formatNaira(parent.summary.serviceFee)}
                />
              )}
              {parent.summary.tax != null && (
                <Row label="Tax" value={formatNaira(parent.summary.tax)} />
              )}
              <Separator className="my-2" />
              <Row
                label="Total"
                value={formatNaira(parent.summary.grandTotal)}
                strong
              />
            </div>
          </Card>

          <h2 className="mt-8 font-display text-xl font-extrabold">Batches</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Message farmers, view products, or contact the rider assigned to each
            batch for follow-up.
          </p>
          <div className="mt-3 space-y-3">
            {parent.batches.length === 0 ? (
              <EmptyState
                icon={<Truck className="h-6 w-6" />}
                title="No batches yet"
                description="Batches will appear once farmers confirm fulfillment."
              />
            ) : (
              parent.batches.map((b, idx) => (
                <BatchCard key={b._id} batch={b} index={idx} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

const Row = ({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className={strong ? "font-semibold" : "text-muted-foreground"}>
      {label}
    </span>
    <span className={strong ? "font-display text-lg font-extrabold" : ""}>
      {value}
    </span>
  </div>
);

const batchTimelineLabel = (batch: Batch, index: number) => {
  if (batch.status === "in_transit" || batch.status === "picked_up") {
    return `Batch ${index + 1} (Delivering Now)`;
  }
  if (batch.type === "scheduled" || batch.slaState === "EXPRESS_READY") {
    return `Batch ${index + 1} (Express Scheduled)`;
  }
  if (batch.status === "waiting_harvest" || batch.slaState === "DELAYED_HARVEST") {
    return `Batch ${index + 1} (Future Harvest)`;
  }
  if (batch.status === "delivered") {
    return `Batch ${index + 1} (Delivered)`;
  }
  return batch.name || `Batch ${index + 1}`;
};

const firstOrderId = (group: FarmerGroup) =>
  group.items.find((item) => item.orderId)?.orderId;

const BatchCard = ({ batch, index }: { batch: Batch; index: number }) => {
  const navigate = useNavigate();
  const orderConversation = useOrderConversation();
  const [messagingKey, setMessagingKey] = useState<string | null>(null);

  const openOrderChat = async (
    orderId: string,
    recipientId?: string,
    key?: string,
  ) => {
    if (!orderId) {
      toast.error("Order reference not available for messaging yet");
      return;
    }
    setMessagingKey(key || orderId);
    try {
      const conversation = await orderConversation.mutateAsync({
        orderId,
        recipientId,
      });
      const cid = conversation._id ?? conversation.id;
      navigate(`/marketplace/messages${cid ? `?conversation=${cid}` : ""}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setMessagingKey(null);
    }
  };

  const openProductChat = async (
    productId: string,
    farmerId: string,
    key: string,
  ) => {
    setMessagingKey(key);
    try {
      const { data } = await api.post("/conversations", {
        productId,
        recipientId: farmerId,
      });
      const cid =
        (data as { _id?: string; id?: string })._id ??
        (data as { id?: string }).id;
      navigate(`/marketplace/messages${cid ? `?conversation=${cid}` : ""}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setMessagingKey(null);
    }
  };

  const batchOrderId =
    batch.farmerGroups
      ?.flatMap((g) => g.items)
      .find((item) => item.orderId)?.orderId;

  return (
    <Card className="rounded-2xl p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{batchTimelineLabel(batch, index)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">
            {batch.type.replace("_", " ")}
            {batch.slaState
              ? ` · ${batch.slaState.replace("_", " ").toLowerCase()}`
              : ""}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {batch.status.replace("_", " ")}
        </Badge>
      </div>

      {batch.slaDeadline && (
        <p className="mt-2 text-xs text-muted-foreground">
          SLA deadline:{" "}
          <span className="font-medium text-foreground">
            {formatDate(batch.slaDeadline)}
          </span>
        </p>
      )}

      {batch.rider && (
        <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Delivery rider
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={batch.rider.profileImage} />
                <AvatarFallback>{initials(batch.rider.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{batch.rider.name}</p>
                {batch.rider.phone && (
                  <a
                    href={`tel:${batch.rider.phone}`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-3 w-3" />
                    {batch.rider.phone}
                  </a>
                )}
              </div>
            </div>
            {batchOrderId && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={messagingKey === `rider-${batch._id}`}
                onClick={() =>
                  openOrderChat(
                    batchOrderId,
                    batch.rider?._id,
                    `rider-${batch._id}`,
                  )
                }
              >
                {messagingKey === `rider-${batch._id}` ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="mr-1 h-4 w-4" />
                )}
                Message rider
              </Button>
            )}
          </div>
        </div>
      )}

      {batch.farmerGroups && batch.farmerGroups.length > 0 && (
        <div className="mt-3 space-y-2">
          {batch.farmerGroups.map((g) => {
            const farmerName =
              g.farmerName || g.farmer?.name || "Farmer";
            const groupOrderId = firstOrderId(g);

            return (
              <div
                key={g.farmerId}
                className="rounded-xl border border-border bg-secondary/30 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={g.farmer?.profileImage} />
                      <AvatarFallback>
                        {initials(farmerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="flex items-center gap-1 text-sm font-medium">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        {farmerName}
                      </p>
                      {g.farmer?.phone && (
                        <a
                          href={`tel:${g.farmer.phone}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {g.farmer.phone}
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {g.items.length} item{g.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  {groupOrderId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={messagingKey === `farmer-${g.farmerId}`}
                      onClick={() =>
                        openOrderChat(
                          groupOrderId,
                          g.farmerId,
                          `farmer-${g.farmerId}`,
                        )
                      }
                    >
                      {messagingKey === `farmer-${g.farmerId}` ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="mr-1 h-4 w-4" />
                      )}
                      Message farmer
                    </Button>
                  )}
                </div>

                <ul className="mt-3 space-y-2">
                  {g.items.map((item) => (
                    <li
                      key={`${item.productId}-${item.orderId || item.title}`}
                      className="rounded-lg border border-border/60 bg-background p-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="m-2.5 h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty {item.quantity}
                            {item.unit ? ` · ${item.unit}` : ""} ·{" "}
                            {formatNaira(item.price * item.quantity)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-full px-2 text-xs"
                              asChild
                            >
                              <Link to={`/marketplace/product/${item.productId}`}>
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                View product
                              </Link>
                            </Button>
                            {item.orderId ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-full px-2 text-xs"
                                disabled={
                                  messagingKey === `product-${item.orderId}`
                                }
                                onClick={() =>
                                  openOrderChat(
                                    item.orderId!,
                                    g.farmerId,
                                    `product-${item.orderId}`,
                                  )
                                }
                              >
                                {messagingKey === `product-${item.orderId}` ? (
                                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <MessageCircle className="mr-1 h-3.5 w-3.5" />
                                )}
                                Message about item
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-full px-2 text-xs"
                                disabled={
                                  messagingKey === `product-${item.productId}`
                                }
                                onClick={() =>
                                  openProductChat(
                                    item.productId,
                                    g.farmerId,
                                    `product-${item.productId}`,
                                  )
                                }
                              >
                                {messagingKey === `product-${item.productId}` ? (
                                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <MessageCircle className="mr-1 h-3.5 w-3.5" />
                                )}
                                Message about item
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {g.pickupAddress?.fullAddress && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {g.pickupAddress.fullAddress}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {batch.routeStops && batch.routeStops.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Route</p>
          <ol className="mt-1 list-decimal pl-4">
            {batch.routeStops.map((stop, i) => (
              <li key={i}>{stop.label || stop.address || `Stop ${i + 1}`}</li>
            ))}
          </ol>
        </div>
      )}

      {!batch.rider && batch.status !== "delivered" && batch.status !== "cancelled" && (
        <p className="mt-3 text-xs text-muted-foreground">
          <Truck className="mr-1 inline h-3 w-3" />
          A rider will appear here once assigned to this batch.
        </p>
      )}
    </Card>
  );
};

export default ParentOrderDetails;
