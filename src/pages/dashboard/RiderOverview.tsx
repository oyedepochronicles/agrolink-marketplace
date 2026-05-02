import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Clock, Truck, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { formatNaira } from "@/lib/format";

const RiderOverview = () => {
  const { data: analytics } = useDashboardAnalytics();
  const cards = analytics?.cards ?? {};
  const charts = analytics?.charts ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Active deliveries</h2>
        <p className="text-sm text-muted-foreground">Manage assigned drops and track your delivery performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={<Truck className="h-4 w-4" />} label="Active" value={String(cards.activeDeliveries ?? 0)} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Delivered this month" value={String(cards.deliveredThisMonth ?? 0)} />
        <Stat icon={<Clock className="h-4 w-4" />} label="Completed" value={String(cards.completedDeliveries ?? 0)} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="Earnings" value={formatNaira(cards.riderEarnings ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">Delivery trend</h3>
          <ChartContainer config={{ deliveries: { label: "Deliveries", color: "hsl(var(--primary))" } }} className="mt-4 h-64">
            <LineChart data={charts.deliveryTrend ?? []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="deliveries" stroke="var(--color-deliveries)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </Card>
        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">Delivery status</h3>
          <ChartContainer config={{ total: { label: "Deliveries", color: "hsl(var(--accent))" } }} className="mt-4 h-64">
            <BarChart data={charts.deliveryStatus ?? []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={6} />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <Card className="rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Delivery board</h3>
            <p className="text-sm text-muted-foreground">Accept available jobs and update live delivery status.</p>
          </div>
          <Link to="/dashboard/rider/deliveries" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Open deliveries <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <Card className="rounded-2xl p-5 shadow-card">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      {label}
    </div>
    <p className="mt-3 font-display text-3xl font-extrabold">{value}</p>
  </Card>
);

export default RiderOverview;
