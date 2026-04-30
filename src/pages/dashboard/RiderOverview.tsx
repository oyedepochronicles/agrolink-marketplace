import { Card } from "@/components/ui/card";
import { Truck } from "lucide-react";

const RiderOverview = () => (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-2xl font-extrabold tracking-tight">Active deliveries</h2>
      <p className="text-sm text-muted-foreground">Manage your assigned drops and update statuses on the go.</p>
    </div>
    <Card className="flex flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow">
        <Truck className="h-6 w-6" />
      </span>
      <p className="font-semibold">No active deliveries</p>
      <p className="max-w-md text-sm text-muted-foreground">
        New assignments will appear here. You'll be able to mark them as picked up, in transit, or delivered.
      </p>
    </Card>
  </div>
);

export default RiderOverview;
