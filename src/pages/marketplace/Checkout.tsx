import { AddressBook } from "@/components/marketplace/AddressBook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addressCoordinates,
  formatAddress,
  useAddresses,
} from "@/hooks/useAddresses";
import { useGroupedCart } from "@/hooks/useGroupedCart";
import { useWalletSummary } from "@/hooks/useWallet";
import { api, apiErrorMessage } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Bike,
  Loader2,
  Package,
  PlusCircle,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Method = "standard" | "pickup" | "express";
type ApiDeliveryMethod = "delivery" | "pickup";
type PaymentChoice = "wallet" | "wallet_partial" | "external";

interface MethodCopy {
  id: Method;
  label: string;
  desc: string;
  icon: React.ElementType;
}

const METHODS: MethodCopy[] = [
  {
    id: "standard",
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
  const { data: walletSummary } = useWalletSummary();
  const [addressId, setAddressId] = useState<string | undefined>(
    defaultAddress?.id,
  );
  const [method, setMethod] = useState<Method>("standard");
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("external");
  const [topUpAmount, setTopUpAmount] = useState(0);
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

  const selectedFee = 0;
  const selectedAddress = addresses.find((a) => a.id === addressId);
  const apiDeliveryMethod: ApiDeliveryMethod =
    method === "pickup" ? "pickup" : "delivery";
  const quoteAddress =
    apiDeliveryMethod === "pickup" || !selectedAddress
      ? undefined
      : {
          recipient: selectedAddress.recipient,
          phone: selectedAddress.phone,
          secondPhone: selectedAddress.secondPhone,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          lga: selectedAddress.lga || "",
          fullAddress: formatAddress(selectedAddress),
          notes: selectedAddress.notes,
          coordinates: addressCoordinates(selectedAddress),
        };
  const quote = useQuery({
    queryKey: [
      "checkout-quote",
      items.map((item) => `${item.productId}:${item.quantity}`).join("|"),
      method,
      quoteAddress?.state,
      quoteAddress?.lga,
      quoteAddress?.city,
      quoteAddress?.coordinates?.join(","),
    ],
    enabled:
      items.length > 0 &&
      (apiDeliveryMethod === "pickup" ||
        Boolean(quoteAddress?.state && quoteAddress?.lga)),
    queryFn: async () => {
      const { data } = await api.post<{
        summary: {
          originalSubtotal: number;
          subtotal: number;
          deliveryFee: number;
          serviceFee: number;
          tax: number;
          discount: number;
          walletDeduction: number;
          grandTotal: number;
        };
      }>("/orders/quote", {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryMethod: apiDeliveryMethod,
        deliveryAddress: quoteAddress,
        deliveryUrgency: method,
      });
      console.log("Checkout quote: ", data);
      return data.summary;
    },
  });
  const summary = quote.data ?? {
    originalSubtotal: subtotal,
    subtotal,
    deliveryFee: method === "pickup" ? 0 : selectedFee,
    serviceFee: 0,
    tax: 0,
    discount: 0,
    walletDeduction: 0,
    grandTotal: subtotal + (method === "pickup" ? 0 : selectedFee),
  };
  const walletBalance = Number(walletSummary?.balance || 0);
  const walletApplied =
    paymentChoice === "wallet"
      ? summary.grandTotal
      : paymentChoice === "wallet_partial"
        ? Math.min(walletBalance, summary.grandTotal)
        : 0;
  const externalDue = Math.max(0, summary.grandTotal - walletApplied);
  const walletCanCover = walletBalance >= summary.grandTotal;
  const suggestedTopUp = Math.max(0, summary.grandTotal - walletBalance);

  const initializeWalletTopUp = async () => {
    const amount = Number(topUpAmount || suggestedTopUp);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid top-up amount");
      return;
    }
    try {
      const { data } = await api.post<{
        authorizationUrl?: string;
        authorization_url?: string;
      }>("/wallet/initialize", { amount });
      const url = data.authorizationUrl ?? data.authorization_url;
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

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
      const { data: checkout } = await api.post<BulkResponse>("/orders/bulk", {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryAddress,
        deliveryMethod: apiDeliveryMethod,
        deliveryUrgency: method === "express" ? "urgent" : "standard",
        paymentMethod: "in_app",
        saleChannel: "marketplace",
      });

      const parentOrderId =
        checkout.parentOrderId ??
        checkout.parentOrder?._id ??
        checkout.parentOrder?.id;

      if (!parentOrderId) {
        throw new Error("No parent order ID returned from checkout");
      }

      if (paymentChoice === "wallet") {
        if (!walletCanCover) {
          toast.error("Wallet balance is not enough for full payment");
          return;
        }
        await api.post("/wallet/pay", { parentOrderId });
        clear();
        toast.success("Order paid with wallet");
        navigate(`/marketplace/orders/${parentOrderId}`);
        return;
      }

      if (paymentChoice === "wallet_partial" && walletApplied > 0) {
        await api.post("/wallet/apply", {
          parentOrderId,
          amount: walletApplied,
        });
        if (externalDue <= 0) {
          clear();
          toast.success("Order paid with wallet");
          navigate(`/marketplace/orders/${parentOrderId}`);
          return;
        }
      }

      const { data: payment } = await api.post("/payments/initialize", {
        parentOrderId,
      });
      const url =
        (
          payment as {
            authorization_url?: string;
            authorizationUrl?: string;
            url?: string;
          }
        ).authorization_url ??
        (payment as { authorizationUrl?: string }).authorizationUrl ??
        (payment as { url?: string }).url;
      clear();
      if (url) {
        window.location.href = url;
      } else {
        toast.success("Order placed");
        navigate(`/marketplace/orders/${parentOrderId}`);
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
              <Row
                label="Original subtotal"
                value={formatNaira(summary.originalSubtotal)}
              />
              <Row
                label="Product subtotal"
                value={formatNaira(summary.subtotal)}
              />
              <Row
                label="Delivery fee"
                value={
                  summary.deliveryFee === 0
                    ? "Free"
                    : formatNaira(summary.deliveryFee)
                }
              />
              <Row
                label="Service fees"
                value={formatNaira(summary.serviceFee)}
              />
              <Row label="Taxes" value={formatNaira(summary.tax)} />
              <Row
                label="Discounts"
                value={`-${formatNaira(summary.discount)}`}
              />
              <Row label="Wallet balance" value={formatNaira(walletBalance)} />
              <Row
                label="Wallet applied"
                value={`-${formatNaira(walletApplied)}`}
              />
              <Row
                label="Service & tax"
                value="Calculated by PhyhanAgro"
                muted
              />
              <div className="my-3 border-t border-border" />
              <Row
                label="Grand total"
                value={formatNaira(summary.grandTotal)}
                bold
              />
              <Row
                label="External payment"
                value={formatNaira(externalDue)}
                bold
              />
            </dl>
            <div className="mt-5 space-y-2">
              <PaymentOption
                active={paymentChoice === "wallet"}
                disabled={!walletCanCover}
                icon={Wallet}
                label="Pay with wallet"
                detail={
                  walletCanCover
                    ? "Use wallet balance for the full checkout."
                    : `Top up ${formatNaira(suggestedTopUp)} to use wallet only.`
                }
                onClick={() => setPaymentChoice("wallet")}
              />
              <PaymentOption
                active={paymentChoice === "wallet_partial"}
                disabled={walletBalance <= 0}
                icon={Wallet}
                label="Use wallet partially"
                detail={`${formatNaira(walletApplied)} from wallet, ${formatNaira(externalDue)} via Paystack.`}
                onClick={() => setPaymentChoice("wallet_partial")}
              />
              <PaymentOption
                active={paymentChoice === "external"}
                icon={ShieldCheck}
                label="Pay with Paystack"
                detail="Skip wallet and pay the full checkout externally."
                onClick={() => setPaymentChoice("external")}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                type="number"
                min={1}
                value={topUpAmount || suggestedTopUp || ""}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                placeholder="Top-up amount"
              />
              <Button
                type="button"
                variant="outline"
                onClick={initializeWalletTopUp}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Top up
              </Button>
            </div>
            {quote.isFetching && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Refreshing delivery fee...
              </p>
            )}
            <Button
              onClick={placeOrder}
              disabled={placing || quote.isFetching}
              className="mt-5 h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
            >
              {placing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {placing
                ? "Processing..."
                : paymentChoice === "wallet"
                  ? `Pay ${formatNaira(summary.grandTotal)} from wallet`
                  : `Pay ${formatNaira(externalDue)} externally`}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" /> Discounts apply
              before wallet funds are used.
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

const PaymentOption = ({
  active,
  disabled,
  icon: Icon,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: React.ElementType;
  label: string;
  detail: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-base disabled:cursor-not-allowed disabled:opacity-50",
      active
        ? "border-primary bg-primary/5"
        : "border-border hover:border-primary/40",
    )}
  >
    <Icon className="h-4 w-4 text-primary" />
    <span className="min-w-0 flex-1">
      <span className="block font-semibold">{label}</span>
      <span className="block text-xs text-muted-foreground">{detail}</span>
    </span>
  </button>
);

export default Checkout;
