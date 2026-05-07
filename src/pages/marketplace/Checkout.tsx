import { AddressBook } from "@/components/marketplace/AddressBook";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatAddress, useAddresses } from "@/hooks/useAddresses";
import { useCart } from "@/hooks/useCart";
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
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Method = "rider" | "pickup" | "express";
type ApiDeliveryMethod = "delivery" | "pickup";

const METHODS: {
  id: Method;
  label: string;
  desc: string;
  fee: number;
  icon: React.ElementType;
}[] = [
  {
    id: "rider",
    label: "Standard rider delivery",
    desc: "Assigned to a verified rider · 1–3 days",
    fee: 1500,
    icon: Bike,
  },
  {
    id: "express",
    label: "Express delivery",
    desc: "Same-day where available",
    fee: 3500,
    icon: Truck,
  },
  {
    id: "pickup",
    label: "Farm pickup",
    desc: "Collect directly from the farmer",
    fee: 0,
    icon: Store,
  },
];

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
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

  const selectedFee = METHODS.find((m) => m.id === method)!.fee;
  const total = subtotal + (method === "pickup" ? 0 : selectedFee);
  const selectedAddress = addresses.find((a) => a.id === addressId);
  const apiDeliveryMethod: ApiDeliveryMethod =
    method === "pickup" ? "pickup" : "delivery";

  const placeOrder = async () => {
    if (method !== "pickup" && !selectedAddress) {
      toast.error("Select a delivery address");
      return;
    }
    setPlacing(true);
    try {
      const orderIds: string[] = [];
      for (const item of items) {
        const deliveryAddress =
          apiDeliveryMethod === "pickup"
            ? undefined
            : {
                street: selectedAddress!.street,
                city: selectedAddress!.city,
                state: selectedAddress!.state,
                lga: selectedAddress!.lga || selectedAddress!.city,
                fullAddress: formatAddress(selectedAddress!),
                notes: selectedAddress!.notes,
              };
        console.log("Placing order for item: ", item);
        const { data: order } = await api.post("/orders", {
          productId: item.productId,
          quantity: item.quantity,
          deliveryAddress,
          deliveryMethod: apiDeliveryMethod,
          deliveryUrgency: method === "express" ? "urgent" : "standard",
          paymentMethod: "in_app",
          saleChannel: "marketplace",
        });
        console.log("Created order", order);
        const oid =
          (order as { _id?: string; id?: string })._id ??
          (order as { id?: string }).id;
        if (oid) orderIds.push(oid);
      }
      // Initialize payment for the batch (first order; backend can group).
      const { data: payment } = await api.post("/payments/initialize", {
        orderIds,
        orderId: orderIds[0],
      });
      const url =
        (payment as { authorization_url?: string; url?: string })
          .authorization_url ?? (payment as { url?: string }).url;
      clear();
      if (url) window.location.href = url;
      else {
        toast.success("Order placed");
        navigate("/marketplace");
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
        Confirm your delivery details and pay securely.
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
                    <span className="text-sm font-bold text-primary">
                      {m.fee === 0 ? "Free" : formatNaira(m.fee)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-bold">Order items</h3>
            <ul className="mt-3 divide-y divide-border">
              {items.map((i) => (
                <li key={i.productId} className="flex items-center gap-3 py-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-secondary">
                    {i.image ? (
                      <img
                        src={i.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="m-3 h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{i.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {i.quantity}
                      {i.unit ? ` · ${i.unit}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold">
                    {formatNaira(i.price * i.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-bold">Summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatNaira(subtotal)} />
              <Row
                label="Delivery"
                value={method === "pickup" ? "Free" : formatNaira(selectedFee)}
              />
              <div className="my-3 border-t border-border" />
              <Row label="Total" value={formatNaira(total)} bold />
            </dl>
            <Button
              onClick={placeOrder}
              disabled={placing}
              className="mt-5 h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
            >
              {placing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {placing ? "Processing..." : `Pay ${formatNaira(total)}`}
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
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div
    className={cn(
      "flex items-center justify-between",
      bold && "text-base font-bold",
    )}
  >
    <dt className={cn(!bold && "text-muted-foreground")}>{label}</dt>
    <dd>{value}</dd>
  </div>
);

export default Checkout;
