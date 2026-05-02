import { Link } from "react-router-dom";
import { ArrowUpRight, BarChart3, Package, ShieldCheck, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAdminVerifications } from "@/hooks/useAdmin";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { formatNaira } from "@/lib/format";

const AdminOverview = () => {
  const { data: analytics } = useDashboardAnalytics();
  const { data: pending = [] } = useAdminVerifications();
  const cards = analytics?.cards ?? {};
  const charts = analytics?.charts ?? {};

  return (
    <div className="space-y-6">
      <PageHeader title="Platform overview" description="Monitor verifications, users, sales, and marketplace health." />

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Pending verifications" value={String(pending.length || cards.pendingVerifications || "-")} to="/dashboard/admin/verifications" />
        <Stat icon={<Users className="h-4 w-4" />} label="Total users" value={String(cards.totalUsers ?? "-")} to="/dashboard/admin/users" />
        <Stat icon={<Package className="h-4 w-4" />} label="Listings" value={String(cards.totalProducts ?? "-")} to="/dashboard/admin/products" />
        <Stat icon={<BarChart3 className="h-4 w-4" />} label="GMV (30d)" value={formatNaira(cards.gmv30d ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">GMV trend</h3>
          <ChartContainer config={{ revenue: { label: "GMV", color: "hsl(var(--primary))" } }} className="mt-4 h-64">
            <LineChart data={charts.salesTrend ?? []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </Card>
        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">Users by role</h3>
          <ChartContainer config={{ total: { label: "Users", color: "hsl(var(--accent))" } }} className="mt-4 h-64">
            <BarChart data={charts.roleCounts ?? []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="role" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={6} />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <Card className="rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Verification queue</h3>
            <p className="text-sm text-muted-foreground">
              {pending.length === 0 ? "All caught up." : `${pending.length} application${pending.length === 1 ? "" : "s"} awaiting review.`}
            </p>
          </div>
          <Link to="/dashboard/admin/verifications" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Open queue <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
};

const Stat = ({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: string; to?: string }) => {
  const body = (
    <Card className="rounded-2xl p-5 shadow-card transition hover:shadow-elegant">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold">{value}</p>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

export default AdminOverview;
