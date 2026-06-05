import { AddressBook } from "@/components/marketplace/AddressBook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  addressCoordinates,
  formatAddress,
  useAddresses,
} from "@/hooks/useAddresses";
import { useGroupedCart } from "@/hooks/useGroupedCart";
import { api, apiErrorMessage } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Bike,
  Loader2,
  Package,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Method = "rider" | "pickup" | "express";
type ApiDeliveryMethod = "delivery" | "pickup";

interface MethodCopy {
  id: Method;
  label: string;
  desc: string;
  icon: React.ElementType;
}

const METHODS: MethodCopy[] = [
  {
    id: "rider",
    label: "Standard rider delivery",
    desc: "Assigned to a verified rider · 1–3 days",
    icon: Bike,
  },
  {
    id: "express",
    label: "Express delivery",
    desc: "Same-day where available",
    icon: Truck,
  },
  {
    id: "pickup",
    label: "Farm pickup",
    desc: "Collect directly from each farmer",
    icon: Store,
  },
];

interface BulkResponse {
  parentOrder?: { _id?: string; id?: string };
  parentOrderId?: string;
  orderIds?: string[];
  summary?: {
    subtotal?: number;
    deliveryFee?: number;
    serviceFee?: number;
    tax?: number;
    grandTotal?: number;
  };
  authorizationUrl?: string;
  authorization_url?: string;
  paymentUrl?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, groups, subtotal, clear } = useGroupedCart();
  const { addresses, defaultAddress } = useAddresses();
  const [addressId, setAddressId] = useState<string | undefined>(
    defaultAddress?.id,
  );
  const [method, setMethod] = useState<Method>("rider");
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Button
          className="mt-4 rounded-full"
          onClick={() => navigate("/marketplace")}
        >
          Browse products
        </Button>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === addressId);
  const apiDeliveryMethod: ApiDeliveryMethod =
    method === "pickup" ? "pickup" : "delivery";

  const placeOrder = async () => {
    if (method !== "pickup" && !selectedAddress) {
      toast.error("Select a delivery address");
      return;
    }
    if (method !== "pickup" && !addressCoordinates(selectedAddress)) {
      toast.error("Pick the exact delivery point for this address");
      return;
    }
    setPlacing(true);
    try {
      const deliveryAddress =
        apiDeliveryMethod === "pickup"
          ? undefined
          : {
              recipient: selectedAddress!.recipient,
              phone: selectedAddress!.phone,
              secondPhone: selectedAddress!.secondPhone,
              street: selectedAddress!.street,
              city: selectedAddress!.city,
              state: selectedAddress!.state,
              lga: selectedAddress!.lga || selectedAddress!.city,
              fullAddress: formatAddress(selectedAddress!),
              notes: selectedAddress!.notes,
              coordinates: addressCoordinates(selectedAddress!),
            };

      const payload = {
        deliveryMethod: apiDeliveryMethod,
        deliveryUrgency: method === "express" ? "urgent" : "standard",
        paymentMethod: "in_app",
        saleChannel: "marketplace",
        deliveryAddress,
        groups: groups.map((g) => ({
          farmerId: g.farmerId,
          items: g.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        })),
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      let parentOrderId: string | undefined;
      let paymentUrl: string | undefined;

      try {
        const { data } = await api.post<BulkResponse>("/orders/bulk", payload);
        parentOrderId =
          data.parentOrderId ?? data.parentOrder?._id ?? data.parentOrder?.id;
        paymentUrl =
          data.authorizationUrl ?? data.authorization_url ?? data.paymentUrl;
      } catch {
        // Fallback: server doesn't expose /orders/bulk yet — submit per item
        // so existing single-order flow keeps working until backend ships.
        const orderIds: string[] = [];
        for (const item of items) {
          const { data: order } = await api.post("/orders", {
            productId: item.productId,
            quantity: item.quantity,
            deliveryAddress,
            deliveryMethod: apiDeliveryMethod,
            deliveryUrgency: method === "express" ? "urgent" : "standard",
            paymentMethod: "in_app",
            saleChannel: "marketplace",
          });
          const oid =
            (order as { _id?: string; id?: string })._id ??
            (order as { id?: string }).id;
          if (oid) orderIds.push(oid);
        }
        const { data: pay } = await api.post("/payments/initialize", {
          orderIds,
          orderId: orderIds[0],
        });
        paymentUrl =
          (pay as { authorization_url?: string }).authorization_url ??
          (pay as { authorizationUrl?: string }).authorizationUrl ??
          (pay as { url?: string }).url;
      }

      // If we have a parent order but no payment URL yet, ask backend to init.
      if (parentOrderId && !paymentUrl) {
        try {
          const { data: pay } = await api.post("/payments/initialize", {
            parentOrderId,
          });
          paymentUrl =
            (pay as { authorization_url?: string }).authorization_url ??
            (pay as { authorizationUrl?: string }).authorizationUrl ??
            (pay as { url?: string }).url;
        } catch {
          /* ignore — fall through */
        }
      }

      clear();
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.success("Order placed");
        navigate("/marketplace/orders");
      }
    } catch (err) {
      console.error("Error placing order", err);
      toast.error(apiErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">
        Checkout
      </h1>
      <p className="text-sm text-muted-foreground">
        Your cart is organised into {groups.length}{" "}
        {groups.length === 1 ? "batch" : "batches"} — one per farmer. Delivery
        fees & taxes are confirmed by PhyhanAgro after you submit.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <AddressBook
              selectable
              selectedId={addressId}
              onSelect={setAddressId}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-bold">Delivery method</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Applied to every batch in this order.
            </p>
            <div className="mt-3 space-y-2">
              {METHODS.map((m) => {
                const active = method === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-base",
                      active
                        ? "border-primary bg-primary/5 shadow-card"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        active
                          ? "bg-gradient-primary text-white shadow-glow"
                          : "bg-secondary text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-bold">Batch preview</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Each farmer becomes its own fulfillment batch.
            </p>
            <div className="mt-3 space-y-3">
              {groups.map((g, idx) => (
                <div
                  key={g.farmerId}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          Batch {idx + 1} · {g.farmerName ?? "Farmer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {g.items.length}{" "}
                          {g.items.length === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {formatNaira(g.subtotal)}
                    </Badge>
                  </div>
                  <ul className="mt-3 divide-y divide-border/60">
                    {g.items.map((i) => (
                      <li
                        key={i.productId}
                        className="flex items-center gap-3 py-2"
                      >
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-secondary">
                          {i.image ? (
                            <img
                              src={i.image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="m-2.5 h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{i.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty {i.quantity}
                            {i.unit ? ` · ${i.unit}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatNaira(i.price * i.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-bold">Summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Items subtotal" value={formatNaira(subtotal)} />
              <Row label="Batches" value={String(groups.length)} />
              <Row
                label="Delivery"
                value="Calculated by PhyhanAgro"
                muted
              />
              <Row label="Service & tax" value="Calculated by PhyhanAgro" muted />
              <div className="my-3 border-t border-border" />
              <Row
                label="Total"
                value={`From ${formatNaira(subtotal)}`}
                bold
              />
            </dl>
            <Button
              onClick={placeOrder}
              disabled={placing}
              className="mt-5 h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
            >
              {placing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {placing ? "Processing..." : "Confirm & pay"}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" /> Secure escrow
              payment via Paystack
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Row = ({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) => (
  <div
    className={cn(
      "flex items-center justify-between",
      bold && "text-base font-bold",
    )}
  >
    <dt className={cn(!bold && "text-muted-foreground")}>{label}</dt>
    <dd className={cn(muted && !bold && "text-xs text-muted-foreground")}>
      {value}
    </dd>
  </div>
);

export default Checkout;
