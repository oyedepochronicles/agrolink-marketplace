import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/dashboard/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAcceptDelivery,
  useAvailableDeliveries,
  useOrderConversation,
  useRiderDeliveries,
  useRiderLiveLocation,
  useUpdateDeliveryStatus,
} from "@/hooks/useOrders";
import { apiErrorMessage } from "@/lib/api";
import {
  formatDate,
  formatNaira,
  formatOrderAddress,
  initials,
} from "@/lib/format";
import type { DeliveryStatus, Order } from "@/types";
import {
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Truck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const NEXT: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  assigned: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};

const NEXT_LABEL: Partial<Record<DeliveryStatus, string>> = {
  assigned: "Mark picked up",
  picked_up: "Mark in transit",
  in_transit: "Mark delivered",
};

const productName = (order: Order) =>
  order.product?.title || order.productId?.name || "Order item";
const productUnit = (order: Order) =>
  order.product?.unit || order.productId?.unit || "unit";
const buyerName = (order: Order) =>
  order.buyer?.name || order.buyerId?.name || "Buyer";
const farmerName = (order: Order) =>
  order.farmer?.name || order.farmerId?.name || "Farmer";
const buyerPhone = (order: Order) => order.buyer?.phone || order.buyerId?.phone;
const farmerPhone = (order: Order) =>
  order.farmer?.phone || order.farmerId?.phone;
const orderTotal = (order: Order) =>
  order.totalAmount ??
  order.total ??
  (order.amount ?? 0) + (order.deliveryFee ?? 0);

type LatLng = { lat: number; lng: number };

const geoToLatLng = (geo?: { coordinates?: number[] }): LatLng | null => {
  const coordinates = geo?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;
  const [lng, lat] = coordinates.map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const pickupPoint = (order: Order) =>
  geoToLatLng(order.pickupLocation?.coordinates) ||
  geoToLatLng(order.pickupAddress?.geo);

const deliveryPoint = (order: Order) =>
  geoToLatLng(order.deliveryLocation?.coordinates) ||
  (typeof order.deliveryAddress === "object"
    ? geoToLatLng(order.deliveryAddress?.geo)
    : null);

const directionsUrl = (destination: LatLng, origin?: LatLng | null) => {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.lat},${destination.lng}`,
    travelmode: "driving",
  });
  if (origin) params.set("origin", `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const staticMapUrl = (order: Order, rider?: LatLng | null) => {
  const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN as string | undefined;
  console.log(order);
  const pickup = pickupPoint(order);
  const delivery = deliveryPoint(order);
  if (!token || !pickup || !delivery) return "";

  const features = [
    rider && {
      type: "Feature",
      properties: { "marker-color": "#2563eb", "marker-symbol": "b" },
      geometry: { type: "Point", coordinates: [rider.lng, rider.lat] },
    },
    {
      type: "Feature",
      properties: { "marker-color": "#16a34a", "marker-symbol": "1" },
      geometry: { type: "Point", coordinates: [pickup.lng, pickup.lat] },
    },
    {
      type: "Feature",
      properties: { "marker-color": "#dc2626", "marker-symbol": "2" },
      geometry: { type: "Point", coordinates: [delivery.lng, delivery.lat] },
    },
    {
      type: "Feature",
      properties: {
        stroke: "#111827",
        "stroke-width": 4,
        "stroke-opacity": 0.8,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          ...(rider ? [[rider.lng, rider.lat]] : []),
          [pickup.lng, pickup.lat],
          [delivery.lng, delivery.lat],
        ],
      },
    },
  ].filter(Boolean);

  const overlay = encodeURIComponent(
    JSON.stringify({ type: "FeatureCollection", features }),
  );
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/geojson(${overlay})/auto/900x520@2x?padding=60&access_token=${token}`;
};

const RiderDeliveries = () => {
  const [tab, setTab] = useState("active");
  const [details, setDetails] = useState<Order | null>(null);
  const [directions, setDirections] = useState<Order | null>(null);
  const [riderPoint, setRiderPoint] = useState<LatLng | null>(null);
  useRiderLiveLocation(true);
  const available = useAvailableDeliveries();
  const mine = useRiderDeliveries();
  console.log(mine);
  const accept = useAcceptDelivery();
  const update = useUpdateDeliveryStatus();
  const orderConversation = useOrderConversation();
  const navigate = useNavigate();
  const activeDeliveries = (mine.data ?? []).filter(
    (o) => o.deliveryStatus !== "delivered",
  );
  const history = (mine.data ?? []).filter(
    (o) => o.deliveryStatus === "delivered",
  );

  const handleAccept = async (id: string) => {
    try {
      await accept.mutateAsync(id);
      toast.success("Delivery accepted");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const advance = async (o: Order) => {
    const next = NEXT[o.deliveryStatus || "assigned"];
    if (!next) return;
    try {
      await update.mutateAsync({ id: o._id, deliveryStatus: next });
      toast.success(`Marked ${next.replace("_", " ")}`);
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
      navigate(`/dashboard/rider/messages${cid ? `?conversation=${cid}` : ""}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const openDirections = (order: Order) => {
    setDirections(order);
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setRiderPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => setRiderPoint(null),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliveries"
        description="Pick up jobs and update status as you ride."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {mine.isLoading ? (
            <CenterSpin />
          ) : activeDeliveries.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="No active deliveries"
              description="Accept a job from the Available tab to get started."
            />
          ) : (
            <div className="space-y-3">
              {activeDeliveries.map((o) => (
                <DeliveryCard
                  key={o._id}
                  order={o}
                  onDetails={() => setDetails(o)}
                  onDirections={() => openDirections(o)}
                  onMessageBuyer={() =>
                    openConversation(o, o.buyer?._id || o.buyerId?._id)
                  }
                  onMessageFarmer={() =>
                    openConversation(o, o.farmer?._id || o.farmerId?._id)
                  }
                  action={
                    NEXT[o.deliveryStatus || "assigned"] && (
                      <Button
                        size="sm"
                        onClick={() => advance(o)}
                        disabled={update.isPending}
                      >
                        {NEXT_LABEL[o.deliveryStatus || "assigned"]}
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-4">
          {available.isLoading ? (
            <CenterSpin />
          ) : (available.data ?? []).length === 0 ? (
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
                  onDetails={() => setDetails(o)}
                  onDirections={() => openDirections(o)}
                  action={
                    <Button
                      size="sm"
                      onClick={() => handleAccept(o._id)}
                      disabled={accept.isPending}
                    >
                      Accept
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {mine.isLoading ? (
            <CenterSpin />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="No delivery history"
            />
          ) : (
            <div className="space-y-3">
              {history.map((o) => (
                <DeliveryCard
                  key={o._id}
                  order={o}
                  onDetails={() => setDetails(o)}
                  onDirections={() => openDirections(o)}
                  onMessageBuyer={() => openConversation(o, o.buyerId?._id)}
                  onMessageFarmer={() => openConversation(o, o.farmerId?._id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DeliveryDetails
        order={details}
        onOpenChange={(open) => !open && setDetails(null)}
      />
      <DirectionsDialog
        order={directions}
        riderPoint={riderPoint}
        onOpenChange={(open) => !open && setDirections(null)}
      />
    </div>
  );
};

const CenterSpin = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const DeliveryCard = ({
  order,
  action,
  onDetails,
  onMessageBuyer,
  onMessageFarmer,
  onDirections,
}: {
  order: Order;
  action?: React.ReactNode;
  onDetails?: () => void;
  onMessageBuyer?: () => void;
  onMessageFarmer?: () => void;
  onDirections?: () => void;
}) => {
  return (
    <Card className="rounded-2xl p-4 shadow-card">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-1 items-center gap-3 min-w-[220px]">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={order.buyerId?.profileImage}
              alt={farmerName(order)}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials(buyerName(order))}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{productName(order)}</p>
            <p className="text-xs text-muted-foreground">
              {order.quantity} x {productUnit(order)} -{" "}
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-extrabold">
            {formatNaira(orderTotal(order))}
          </p>
          <OrderStatusBadge status={deliveryStatusForBadge(order)} />
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button size="sm" variant="outline" onClick={onDetails}>
            Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDirections}
            className="gap-1"
          >
            <Navigation className="h-4 w-4" /> Directions
          </Button>
          {onMessageBuyer && (
            <Button
              size="sm"
              variant="outline"
              onClick={onMessageBuyer}
              className="gap-1"
            >
              <MessageCircle className="h-4 w-4" /> Buyer
            </Button>
          )}
          {onMessageFarmer && (
            <Button
              size="sm"
              variant="outline"
              onClick={onMessageFarmer}
              className="gap-1"
            >
              <MessageCircle className="h-4 w-4" /> Farmer
            </Button>
          )}
          {action}
        </div>
      </div>
      {order.deliveryAddress && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />{" "}
            {formatOrderAddress(order.deliveryAddress)}
          </span>
          {order.matching && (
            <span>
              {order.matching.source === "mapbox" &&
              order.matching.totalDurationMin
                ? `${order.matching.totalDurationMin} min ETA`
                : `${order.matching.pickupDistanceKm} km to pickup`}{" "}
              - {order.matching.deliveryDistanceKm} km delivery
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

const DeliveryDetails = ({
  order,
  onOpenChange,
}: {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={!!order} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Delivery details</DialogTitle>
      </DialogHeader>
      {order && (
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info
              label="Order"
              value={`#${order._id.slice(-8).toUpperCase()}`}
            />
            <Info label="Urgency" value={order.deliveryUrgency || "standard"} />
            <Info
              label="Item"
              value={`${productName(order)} - ${order.quantity} ${productUnit(order)}`}
            />
            <Info label="Value" value={formatNaira(orderTotal(order))} />
          </div>
          <Info
            icon={<MapPin className="h-4 w-4" />}
            label="Pickup"
            value={
              order.pickupAddress?.fullAddress ||
              order.farmerId?.farmerProfile?.farmAddress ||
              order.farmerId?.location?.fullAddress ||
              "Farm address not provided"
            }
          />
          <Info
            icon={<MapPin className="h-4 w-4" />}
            label="Deliver to"
            value={
              formatOrderAddress(order.deliveryAddress) ||
              "Delivery address not provided"
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Info
              icon={<UserRound className="h-4 w-4" />}
              label="Sender"
              value={farmerName(order)}
            />
            <Info
              icon={<Phone className="h-4 w-4" />}
              label="Sender phone"
              value={farmerPhone(order) || "Not provided"}
            />
            <Info
              icon={<UserRound className="h-4 w-4" />}
              label="Receiver"
              value={buyerName(order)}
            />
            <Info
              icon={<Phone className="h-4 w-4" />}
              label="Receiver phone"
              value={buyerPhone(order) || "Not provided"}
            />
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

const DirectionsDialog = ({
  order,
  riderPoint,
  onOpenChange,
}: {
  order: Order | null;
  riderPoint?: LatLng | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const pickup = order ? pickupPoint(order) : null;
  const delivery = order ? deliveryPoint(order) : null;
  const mapUrl = order ? staticMapUrl(order, riderPoint) : "";
  const nextStop =
    order?.deliveryStatus === "picked_up" ||
    order?.deliveryStatus === "in_transit"
      ? delivery
      : pickup;

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Directions</DialogTitle>
        </DialogHeader>
        {order && (
          <div className="space-y-4">
            {mapUrl ? (
              <img
                src={mapUrl}
                alt="Pickup and delivery route map"
                className="aspect-[16/9] w-full rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center rounded-lg border border-dashed border-border bg-muted text-center text-sm text-muted-foreground">
                Add VITE_MAPBOX_PUBLIC_TOKEN and make sure this order has pickup
                and delivery coordinates to preview the map.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Info
                icon={<MapPin className="h-4 w-4" />}
                label="Pickup"
                value={
                  order.pickupLocation?.address ||
                  order.pickupAddress?.fullAddress ||
                  "Pickup coordinates not provided"
                }
              />
              <Info
                icon={<MapPin className="h-4 w-4" />}
                label="Delivery"
                value={
                  order.deliveryLocation?.address ||
                  formatOrderAddress(order.deliveryAddress) ||
                  "Delivery coordinates not provided"
                }
              />
            </div>

            {order.matching && (
              <p className="text-sm text-muted-foreground">
                {order.matching.source === "mapbox" &&
                order.matching.totalDurationMin
                  ? `${order.matching.totalDurationMin} min estimated drive`
                  : `${order.matching.pickupDistanceKm} km to pickup`}{" "}
                - {order.matching.deliveryDistanceKm} km delivery
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {nextStop && (
                <Button asChild className="gap-2">
                  <a
                    href={directionsUrl(nextStop, riderPoint)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation className="h-4 w-4" /> Navigate next stop
                  </a>
                </Button>
              )}
              {pickup && (
                <Button asChild variant="outline">
                  <a
                    href={directionsUrl(pickup, riderPoint)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pickup
                  </a>
                </Button>
              )}
              {delivery && (
                <Button asChild variant="outline">
                  <a
                    href={directionsUrl(delivery, pickup)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pickup to delivery
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Info = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}) => (
  <div className="rounded-lg border border-border p-3">
    <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
      {icon}
      {label}
    </p>
    <p className="font-medium text-foreground">{value || "—"}</p>
  </div>
);

const deliveryStatusForBadge = (order: Order): Order["status"] => {
  if (
    order.deliveryStatus === "assigned" ||
    order.deliveryStatus === "picked_up"
  )
    return "processing";
  if (
    order.deliveryStatus === "in_transit" ||
    order.deliveryStatus === "delivered"
  )
    return order.deliveryStatus;
  return order.status;
};

export default RiderDeliveries;
