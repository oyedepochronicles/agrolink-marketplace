// Farm Exchange — the verified-farmer <-> verified-farmer by-product marketplace.
// This is HARD-partitioned from the consumer marketplace on the server
// (marketType:'exchange'); nothing here ever touches the buyer storefront, the
// Wallet, or Payout. Settlement is arranged offline between the two farmers, which
// is why the seller's contact is revealed only once they ACCEPT an order.
//
// One nav entry, four tabs: Browse (others' listings), My Listings (own, editable),
// Purchases (orders I placed), Sales (orders on my listings). NO auto-classification
// of by-products anywhere — the platform only ever echoes what the farmer declared.
import { ExchangeListingDialog } from "@/components/dashboard/ExchangeListingDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAcceptExchangeOrder,
  useCancelExchangeOrder,
  useCompleteExchangeOrder,
  useDeleteExchangeListing,
  useExchangeListings,
  useExchangePurchases,
  useExchangeSales,
  useMyExchangeListings,
  usePlaceExchangeOrder,
  useRejectExchangeOrder,
} from "@/hooks/useExchange";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { NIGERIAN_STATES, lgasForState } from "@/lib/nigerianLocations";
import {
  EXCHANGE_CATEGORIES,
  type ExchangeListing,
  type ExchangeOrder,
  type ExchangeOrderStatus,
} from "@/types/exchange";
import {
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Recycle,
  Search,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

const priceLabel = (l: Pick<ExchangeListing, "price" | "pricingType">) =>
  l.pricingType === "free" || !l.price ? "Free" : formatNaira(l.price);

const ORDER_STATUS: Record<
  ExchangeOrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

const OrderStatusBadge = ({ status }: { status: ExchangeOrderStatus }) => {
  const s = ORDER_STATUS[status] ?? ORDER_STATUS.pending;
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

const ListingThumb = ({ url }: { url?: string }) =>
  url ? (
    <img src={url} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-secondary/60 text-muted-foreground">
      <Leaf className="h-6 w-6" />
    </div>
  );

// A farmer's own declaration, shown verbatim. Never a platform claim.
const ByproductNotes = ({ listing }: { listing: ExchangeListing }) => {
  const bp = listing.byproduct;
  if (!bp?.suggestedUse && !bp?.safetyNote && !bp?.notForHumanConsumption) return null;
  return (
    <div className="space-y-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
      {bp.notForHumanConsumption && (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> Not for human consumption
        </Badge>
      )}
      {bp.suggestedUse && (
        <p>
          <span className="font-medium text-foreground">Suggested use: </span>
          {bp.suggestedUse}
        </p>
      )}
      {bp.safetyNote && (
        <p>
          <span className="font-medium text-foreground">Handling note: </span>
          {bp.safetyNote}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Declared by the seller. PhyhanAgro makes no safety or edibility claim — check
        it yourself before use.
      </p>
    </div>
  );
};

// Contact block appears only once the server has shared it (order accepted).
const ContactCard = ({ order }: { order: ExchangeOrder }) => {
  if (!order.contactShared || !order.contact) return null;
  const c = order.contact;
  return (
    <div className="space-y-1 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
      <p className="flex items-center gap-1.5 font-medium text-foreground">
        <CheckCircle2 className="h-4 w-4 text-primary" /> Contact shared
      </p>
      {c.name && <p>{c.name}</p>}
      {c.phone && (
        <p className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          <a href={`tel:${c.phone}`} className="hover:underline">
            {c.phone}
          </a>
        </p>
      )}
      {c.email && (
        <p className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <a href={`mailto:${c.email}`} className="hover:underline">
            {c.email}
          </a>
        </p>
      )}
      {(c.state || c.lga) && (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {[c.lga, c.state].filter(Boolean).join(", ")}
        </p>
      )}
      <p className="pt-1 text-[11px] text-muted-foreground">
        Arrange payment and pickup/delivery directly. Keep records of what you agree.
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Browse tab
// ---------------------------------------------------------------------------

const BrowseTab = () => {
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ExchangeListing | null>(null);

  const params = useMemo(
    () => ({
      category: category || undefined,
      state: state || undefined,
      lga: lga || undefined,
      search: search.trim() || undefined,
      page,
      limit: 12,
    }),
    [category, state, lga, search, page],
  );

  const { data, isLoading, isError, error } = useExchangeListings(params);
  const lgaOptions = useMemo(() => lgasForState(state), [state]);

  const resetToFirstPage = () => setPage(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search by-products…"
            className="pl-9"
          />
        </div>
        <Select
          value={category || "all"}
          onValueChange={(v) => {
            setCategory(v === "all" ? "" : v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All categories</SelectItem>
            {EXCHANGE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={state || "all"}
          onValueChange={(v) => {
            setState(v === "all" ? "" : v);
            setLga("");
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All states</SelectItem>
            {NIGERIAN_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={lga || "all"}
          onValueChange={(v) => {
            setLga(v === "all" ? "" : v);
            resetToFirstPage();
          }}
          disabled={!state}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="LGA" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All LGAs</SelectItem>
            {lgaOptions.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Couldn't load listings"
          description={apiErrorMessage(error)}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Recycle className="h-6 w-6" />}
          title="No listings match your filters"
          description="Try clearing the filters, or check back later — farmers add by-products regularly."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((l) => (
              <Card
                key={l._id}
                className="flex cursor-pointer flex-col overflow-hidden rounded-2xl transition hover:shadow-card"
                onClick={() => setSelected(l)}
              >
                <div className="h-36 w-full overflow-hidden">
                  <ListingThumb url={l.images?.[0]} />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-tight">{l.name}</p>
                    <Badge variant="secondary" className="shrink-0">
                      {l.category}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-primary">{priceLabel(l)}</p>
                  <p className="text-sm text-muted-foreground">
                    {l.quantity} {l.unit} available
                  </p>
                  {(l.location?.state || l.location?.lga) && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[l.location?.lga, l.location?.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {l.farmer?.name && (
                    <p className="mt-auto flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                      {l.farmer.name}
                      {typeof l.farmer.avgRating === "number" &&
                        l.farmer.ratingsCount ? (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {l.farmer.avgRating.toFixed(1)}
                        </span>
                      ) : null}
                    </p>
                  )}
                  {l.byproduct?.notForHumanConsumption && (
                    <Badge variant="destructive" className="w-fit gap-1 text-[10px]">
                      <AlertTriangle className="h-3 w-3" /> Not for human consumption
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {data.meta && data.meta.pages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {data.meta.page} of {data.meta.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <PlaceOrderDialog
        listing={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Place-order dialog (from Browse)
// ---------------------------------------------------------------------------

const PlaceOrderDialog = ({
  listing,
  onOpenChange,
}: {
  listing: ExchangeListing | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const place = usePlaceExchangeOrder();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  // Reset the small form whenever a different listing is opened.
  const open = !!listing;
  const listingId = listing?._id;
  useEffect(() => {
    if (listingId) {
      setQuantity(1);
      setNote("");
    }
  }, [listingId]);

  const submit = async () => {
    if (!listing) return;
    if (quantity <= 0) return toast.error("Enter a quantity greater than zero.");
    if (quantity > listing.quantity)
      return toast.error(`Only ${listing.quantity} ${listing.unit} available.`);
    try {
      await place.mutateAsync({
        productId: listing._id,
        quantity,
        buyerNote: note.trim() || undefined,
      });
      toast.success("Request sent to the seller");
      onOpenChange(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {listing && (
          <>
            <DialogHeader>
              <DialogTitle>{listing.name}</DialogTitle>
              <DialogDescription>
                {priceLabel(listing)} · {listing.quantity} {listing.unit} available ·{" "}
                {listing.category}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {listing.images?.[0] && (
                <div className="h-40 w-full overflow-hidden rounded-xl">
                  <ListingThumb url={listing.images[0]} />
                </div>
              )}
              {listing.description && (
                <p className="text-sm text-muted-foreground">{listing.description}</p>
              )}

              <ByproductNotes listing={listing} />

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {(listing.location?.state || listing.location?.lga) && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {[listing.location?.lga, listing.location?.state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {listing.deliveryOption && (
                  <p className="capitalize text-muted-foreground">
                    Delivery: {listing.deliveryOption}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order-qty">Quantity ({listing.unit})</Label>
                <Input
                  id="order-qty"
                  type="number"
                  min={1}
                  max={listing.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="order-note">Message to seller (optional)</Label>
                <Textarea
                  id="order-note"
                  rows={3}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="When you'd like to collect, questions about the by-product…"
                />
              </div>

              <p className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                The seller sees your request and decides whether to accept. Their
                contact details are shared with you only if they accept. Payment and
                collection are arranged directly between you.
              </p>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={place.isPending}>
                Send request
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// My Listings tab
// ---------------------------------------------------------------------------

const LISTING_STATUS: Record<
  ExchangeListing["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  available: { label: "Available", variant: "default" },
  reserved: { label: "Reserved", variant: "secondary" },
  sold: { label: "Sold", variant: "outline" },
  expired: { label: "Expired", variant: "outline" },
};

const MyListingsTab = () => {
  const { data: listings, isLoading } = useMyExchangeListings();
  const del = useDeleteExchangeListing();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExchangeListing | undefined>();
  const [deleting, setDeleting] = useState<ExchangeListing | null>(null);

  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const openEdit = (l: ExchangeListing) => {
    setEditing(l);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting._id);
      toast.success("Listing removed");
      setDeleting(null);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> New listing
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : !listings || listings.length === 0 ? (
        <EmptyState
          icon={<Recycle className="h-6 w-6" />}
          title="You have no exchange listings yet"
          description="List a farm by-product — crop residue, manure, spent substrate, surplus feed — for other verified farmers."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Create your first listing
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const status = LISTING_STATUS[l.status] ?? LISTING_STATUS.available;
            return (
              <Card key={l._id} className="flex flex-col overflow-hidden rounded-2xl">
                <div className="h-32 w-full overflow-hidden">
                  <ListingThumb url={l.images?.[0]} />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-tight">{l.name}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(l)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleting(l)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <Badge variant="secondary">{l.category}</Badge>
                    {l.adminStatus === "inactive" && (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                  </div>
                  <p className="text-lg font-bold text-primary">{priceLabel(l)}</p>
                  <p className="text-sm text-muted-foreground">
                    {l.quantity} {l.unit}
                  </p>
                  {l.createdAt && (
                    <p className="mt-auto pt-1 text-xs text-muted-foreground">
                      Listed {formatDate(l.createdAt)}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ExchangeListingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        listing={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" will be removed from the exchange. Orders already
              placed against it are kept for both parties' records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Orders (Purchases + Sales share a card; actions differ by role)
// ---------------------------------------------------------------------------

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const OrderCard = ({
  order,
  perspective,
}: {
  order: ExchangeOrder;
  perspective: "buyer" | "seller";
}) => {
  const accept = useAcceptExchangeOrder();
  const reject = useRejectExchangeOrder();
  const cancel = useCancelExchangeOrder();
  const complete = useCompleteExchangeOrder();

  const busy =
    accept.isPending || reject.isPending || cancel.isPending || complete.isPending;

  const run = async (
    fn: (args: { id: string }) => Promise<unknown>,
    okMsg: string,
  ) => {
    try {
      await fn({ id: order._id });
      toast.success(okMsg);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const snap = order.listingSnapshot;
  const counterparty = perspective === "buyer" ? order.seller : order.buyer;

  return (
    <Card className="space-y-3 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{snap?.name ?? "Listing"}</p>
          <p className="text-xs text-muted-foreground">
            {order.quantity} {snap?.unit} ·{" "}
            {order.pricingType === "free" || !order.totalAmount
              ? "Free"
              : formatNaira(order.totalAmount)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="text-sm text-muted-foreground">
        {perspective === "buyer" ? "Seller" : "Buyer"}:{" "}
        <span className="text-foreground">{counterparty?.name ?? "—"}</span>
        {counterparty?.state ? ` · ${counterparty.state}` : ""}
      </div>

      {order.buyerNote && (
        <p className="rounded-lg bg-secondary/50 p-2.5 text-sm">
          <span className="font-medium">Buyer note: </span>
          {order.buyerNote}
        </p>
      )}
      {order.decisionNote && (
        <p className="rounded-lg bg-secondary/50 p-2.5 text-sm">
          <span className="font-medium">Seller note: </span>
          {order.decisionNote}
        </p>
      )}

      <ContactCard order={order} />

      <p className="text-xs text-muted-foreground">
        Placed {formatDate(order.createdAt)}
      </p>

      {/* Actions gated by perspective + status. The server re-checks every one. */}
      <div className="flex flex-wrap gap-2">
        {perspective === "seller" && order.status === "pending" && (
          <>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => run(accept.mutateAsync, "Order accepted — contact shared")}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => run(reject.mutateAsync, "Order rejected")}
            >
              Reject
            </Button>
          </>
        )}
        {perspective === "buyer" && order.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => run(cancel.mutateAsync, "Order cancelled")}
          >
            Cancel request
          </Button>
        )}
        {order.status === "accepted" && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => run(complete.mutateAsync, "Marked completed")}
          >
            Mark completed
          </Button>
        )}
      </div>
    </Card>
  );
};

const OrdersTab = ({ perspective }: { perspective: "buyer" | "seller" }) => {
  const [status, setStatus] = useState("all");
  const statusArg = status === "all" ? undefined : (status as ExchangeOrderStatus);
  const purchases = useExchangePurchases(
    perspective === "buyer" ? statusArg : undefined,
  );
  const sales = useExchangeSales(perspective === "seller" ? statusArg : undefined);
  const query = perspective === "buyer" ? purchases : sales;
  const orders = query.data;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={<Recycle className="h-6 w-6" />}
          title={
            perspective === "buyer"
              ? "You haven't requested any by-products yet"
              : "No one has requested your listings yet"
          }
          description={
            perspective === "buyer"
              ? "Browse the exchange and send a request to a seller."
              : "When another farmer requests one of your listings it will appear here for you to accept or reject."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orders.map((o) => (
            <OrderCard key={o._id} order={o} perspective={perspective} />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const FarmerExchange = () => (
  <div className="space-y-6">
    <PageHeader
      title="Farm Exchange"
      description="Buy, sell, or give away farm by-products with other verified farmers. Separate from the buyer marketplace — settlement is arranged directly between farmers."
    />

    <Tabs defaultValue="browse">
      <TabsList className="flex-wrap">
        <TabsTrigger value="browse">Browse</TabsTrigger>
        <TabsTrigger value="mine">My listings</TabsTrigger>
        <TabsTrigger value="purchases">My requests</TabsTrigger>
        <TabsTrigger value="sales">Requests to me</TabsTrigger>
      </TabsList>

      <TabsContent value="browse" className="mt-4">
        <BrowseTab />
      </TabsContent>
      <TabsContent value="mine" className="mt-4">
        <MyListingsTab />
      </TabsContent>
      <TabsContent value="purchases" className="mt-4">
        <OrdersTab perspective="buyer" />
      </TabsContent>
      <TabsContent value="sales" className="mt-4">
        <OrdersTab perspective="seller" />
      </TabsContent>
    </Tabs>
  </div>
);

export default FarmerExchange;
