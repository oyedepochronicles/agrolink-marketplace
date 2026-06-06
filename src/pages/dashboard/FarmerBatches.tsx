import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFarmerBatches, useUpdateBatchStatus } from "@/hooks/useBatchOrders";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Batch } from "@/types/batch";
import { CheckCircle2, Loader2, MapPin, PackageCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FarmerBatches = () => {
  const { data: batches = [], isLoading } = useFarmerBatches();
  const [tab, setTab] = useState("active");

  const active = batches.filter((b) => !["delivered", "cancelled"].includes(b.status));
  const completed = batches.filter((b) => ["delivered", "cancelled"].includes(b.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch orders"
        description="Each batch groups your accepted orders by pickup window. Mark them ready when produce is packed."
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
            <EmptyState
              icon={<PackageCheck className="h-6 w-6" />}
              title="No active batches"
              description="When buyers pay for your products, batches will appear here."
            />
          ) : (
            active.map((b) => <FarmerBatchCard key={b._id} batch={b} />)
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-4 space-y-3">
          {isLoading ? (
            <Spin />
          ) : completed.length === 0 ? (
            <EmptyState
              icon={<PackageCheck className="h-6 w-6" />}
              title="No completed batches yet"
            />
          ) : (
            completed.map((b) => <FarmerBatchCard key={b._id} batch={b} />)
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

const FarmerBatchCard = ({ batch }: { batch: Batch }) => {
  const update = useUpdateBatchStatus();
  const advance = async (status: string) => {
    try {
      await update.mutateAsync({ id: batch._id, status });
      toast.success(`Batch marked ${status.replace("_", " ")}`);
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
          <p className="mt-0.5 text-xs text-muted-foreground">
            {batch.farmerGroups?.[0]?.items.length ?? 0} item
            {(batch.farmerGroups?.[0]?.items.length ?? 0) === 1 ? "" : "s"}
            {batch.pickupSchedule?.date && (
              <> · Pickup {formatDate(batch.pickupSchedule.date)}</>
            )}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {batch.status.replace("_", " ")}
        </Badge>
      </div>

      {batch.farmerGroups?.[0]?.pickupAddress?.fullAddress && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {batch.farmerGroups[0].pickupAddress.fullAddress}
        </p>
      )}

      {batch.slaDeadline && (
        <p className="mt-1 text-xs text-muted-foreground">
          SLA deadline: <span className="font-medium text-foreground">{formatDate(batch.slaDeadline)}</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {batch.status === "open" && (
          <Button size="sm" onClick={() => advance("ready")} disabled={update.isPending}>
            Mark ready
          </Button>
        )}
        {batch.status === "ready" && (
          <Button size="sm" variant="outline" onClick={() => advance("picked_up")} disabled={update.isPending} className="gap-1">
            <CheckCircle2 className="h-4 w-4" /> Confirm picked up
          </Button>
        )}
      </div>
    </Card>
  );
};

export default FarmerBatches;
