import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { SLABadge } from "@/components/marketplace/SLABadge";
import { useFarmerBatches } from "@/hooks/useBatchOrders";
import { formatDate } from "@/lib/format";
import type { SLAState } from "@/types/batch";
import { Loader2, Timer } from "lucide-react";

const FarmerSLA = () => {
  const { data: batches = [], isLoading } = useFarmerBatches();

  const computeState = (deadline?: string): SLAState => {
    if (!deadline) return "READY_NOW";
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff < 0) return "OVERDUE";
    if (diff < 12 * 3600 * 1000) return "EXPRESS_READY";
    return "READY_NOW";
  };

  const rows = batches
    .filter((b) => !["delivered", "cancelled"].includes(b.status))
    .map((b) => ({ batch: b, state: b.slaState || computeState(b.slaDeadline) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA monitor"
        description="Track fulfillment deadlines and surface overdue batches before they impact buyers."
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Timer className="h-6 w-6" />}
          title="No active SLAs"
          description="Active batches with deadlines will appear here."
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ batch, state }) => (
            <Card key={batch._id} className="flex flex-wrap items-center gap-3 rounded-2xl p-4 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {batch.name || `Batch #${batch._id.slice(-6).toUpperCase()}`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {batch.slaDeadline
                    ? `Deadline ${formatDate(batch.slaDeadline)}`
                    : "No deadline set"}
                </p>
              </div>
              <SLABadge state={state} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerSLA;
