import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { useFarmerBatches } from "@/hooks/useBatchOrders";
import { formatDate } from "@/lib/format";
import { Loader2, MapPin, Truck } from "lucide-react";

const FarmerPickupCenter = () => {
  const { data: batches = [], isLoading } = useFarmerBatches();
  const upcoming = batches.filter(
    (b) => ["open", "ready"].includes(b.status) && b.pickupSchedule?.date,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup center"
        description="Upcoming rider pickups grouped by scheduled window."
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-6 w-6" />}
          title="No scheduled pickups"
          description="Once a rider is assigned, the pickup window will appear here."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {upcoming.map((b) => (
            <Card key={b._id} className="rounded-2xl p-4 shadow-card">
              <p className="font-semibold">
                {b.name || `Batch #${b._id.slice(-6).toUpperCase()}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {b.pickupSchedule?.date && formatDate(b.pickupSchedule.date)}
                {b.pickupSchedule?.startTime && (
                  <> · {b.pickupSchedule.startTime}
                    {b.pickupSchedule.endTime ? `–${b.pickupSchedule.endTime}` : ""}
                  </>
                )}
              </p>
              {b.farmerGroups?.[0]?.pickupAddress?.fullAddress && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {b.farmerGroups[0].pickupAddress.fullAddress}
                </p>
              )}
              {b.rider && (
                <p className="mt-2 text-xs">
                  Rider: <span className="font-medium">{b.rider.name}</span>
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerPickupCenter;
