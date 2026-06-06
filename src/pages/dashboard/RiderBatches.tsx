import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRiderBatches, useUpdateBatchStatus } from "@/hooks/useBatchOrders";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Batch } from "@/types/batch";
import { Loader2, MapPin, Navigation, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  ready: { next: "in_transit", label: "Start delivery" },
  in_transit: { next: "delivered", label: "Mark delivered" },
};

const RiderBatches = () => {
  const { data: batches = [], isLoading } = useRiderBatches();
  const [tab, setTab] = useState("active");
  const active = batches.filter((b) => !["delivered", "cancelled"].includes(b.status));
  const history = batches.filter((b) => ["delivered", "cancelled"].includes(b.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active batches"
        description="Optimised farm stops and consolidated drop-offs assigned to you."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4 space-y-3">
          {isLoading ? (
            <Spin />
          ) : active.length === 0 ? (
            <EmptyState icon={<Truck className="h-6 w-6" />} title="No active batches" />
          ) : (
            active.map((b) => <RiderBatchCard key={b._id} batch={b} />)
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-4 space-y-3">
          {isLoading ? (
            <Spin />
          ) : history.length === 0 ? (
            <EmptyState icon={<Truck className="h-6 w-6" />} title="No history yet" />
          ) : (
            history.map((b) => <RiderBatchCard key={b._id} batch={b} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Spin = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const RiderBatchCard = ({ batch }: { batch: Batch }) => {
  const update = useUpdateBatchStatus();
  const action = NEXT_STATUS[batch.status];
  const stops = batch.routeStops ?? [];

  const advance = async () => {
    if (!action) return;
    try {
      await update.mutateAsync({ id: batch._id, status: action.next });
      toast.success(`Batch marked ${action.next.replace("_", " ")}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Card className="rounded-2xl p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {batch.name || `Batch #${batch._id.slice(-6).toUpperCase()}`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">
            {batch.type.replace("_", " ")}
            {batch.pickupSchedule?.date && <> · Pickup {formatDate(batch.pickupSchedule.date)}</>}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {batch.status.replace("_", " ")}
        </Badge>
      </div>

      {stops.length > 0 && (
        <ol className="mt-3 space-y-1 border-l border-border pl-4 text-xs text-muted-foreground">
          {stops
            .slice()
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((s, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[18px] top-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-primary/20 text-[8px] font-bold text-primary">
                  {(s.sequence ?? i) + 1}
                </span>
                <span className="font-medium text-foreground">{s.label || `Stop ${i + 1}`}</span>
                {s.address && <> — {s.address}</>}
              </li>
            ))}
        </ol>
      )}

      {batch.destination?.address && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> Destination: {batch.destination.address}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {action && (
          <Button size="sm" onClick={advance} disabled={update.isPending} className="gap-1">
            <Navigation className="h-4 w-4" /> {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default RiderBatches;
