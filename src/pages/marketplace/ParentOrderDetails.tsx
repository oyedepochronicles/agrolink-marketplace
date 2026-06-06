import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useParentOrder } from "@/hooks/useBatchOrders";
import { formatDate, formatNaira } from "@/lib/format";
import type { Batch } from "@/types/batch";
import { ArrowLeft, Loader2, MapPin, Package, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";

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
                Placed {formatDate(parent.createdAt)} · {parent.batches.length} batch
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
              <Row label="Subtotal" value={formatNaira(parent.summary.subtotal)} />
              <Row
                label="Delivery"
                value={formatNaira(
                  parent.summary.consolidatedDeliveryFee ?? parent.summary.deliveryFee,
                )}
              />
              {parent.summary.serviceFee != null && (
                <Row label="Service fee" value={formatNaira(parent.summary.serviceFee)} />
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
          <div className="mt-3 space-y-3">
            {parent.batches.length === 0 ? (
              <EmptyState
                icon={<Truck className="h-6 w-6" />}
                title="No batches yet"
                description="Batches will appear once farmers confirm fulfillment."
              />
            ) : (
              parent.batches.map((b) => <BatchCard key={b._id} batch={b} />)
            )}
          </div>
        </>
      )}
    </div>
  );
};

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
    <span className={strong ? "font-display text-lg font-extrabold" : ""}>{value}</span>
  </div>
);

const BatchCard = ({ batch }: { batch: Batch }) => (
  <Card className="rounded-2xl p-4 shadow-card">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold">
          {batch.name || `Batch #${batch._id.slice(-6).toUpperCase()}`}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground capitalize">
          {batch.type.replace("_", " ")}
        </p>
      </div>
      <Badge variant="outline" className="capitalize">
        {batch.status.replace("_", " ")}
      </Badge>
    </div>

    {batch.slaDeadline && (
      <p className="mt-2 text-xs text-muted-foreground">
        SLA deadline: <span className="font-medium text-foreground">{formatDate(batch.slaDeadline)}</span>
      </p>
    )}

    {batch.farmerGroups && batch.farmerGroups.length > 0 && (
      <div className="mt-3 space-y-2">
        {batch.farmerGroups.map((g) => (
          <div
            key={g.farmerId}
            className="rounded-xl border border-border bg-secondary/30 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{g.farmerName || g.farmer?.name || "Farmer"}</p>
              <span className="text-xs text-muted-foreground">
                {g.items.length} item{g.items.length === 1 ? "" : "s"}
              </span>
            </div>
            {g.pickupAddress?.fullAddress && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {g.pickupAddress.fullAddress}
              </p>
            )}
          </div>
        ))}
      </div>
    )}

    {batch.rider && (
      <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Truck className="h-3 w-3" /> Rider:{" "}
        <span className="font-medium text-foreground">{batch.rider.name}</span>
      </div>
    )}
  </Card>
);

export default ParentOrderDetails;
