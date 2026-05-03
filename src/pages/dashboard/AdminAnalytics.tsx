import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { formatNaira } from "@/lib/format";
import { Activity, Banknote, ShoppingBag, UserPlus } from "lucide-react";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

const AdminAnalytics = () => {
  const { data, isLoading } = useDashboardAnalytics();
  const cards = data?.cards ?? {};
  const charts = data?.charts ?? {};
  const stateMap = data?.maps?.ordersByState ?? {};
  const stateData = Object.entries(stateMap).map(([state, total]) => ({ state, total })).slice(0, 10);
  const roleData = (charts.roleCounts ?? []) as Array<{ role: string; total: number }>;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Deep-dive into platform performance, revenue, and growth." />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Stat icon={<ShoppingBag className="h-4 w-4" />} label="Orders (30d)" value={String(cards.orders30d ?? cards.ordersThisMonth ?? 0)} />
          <Stat icon={<Banknote className="h-4 w-4" />} label="GMV (30d)" value={formatNaira(cards.gmv30d ?? 0)} />
          <Stat icon={<UserPlus className="h-4 w-4" />} label="New users (30d)" value={String(cards.newUsers30d ?? 0)} />
          <Stat icon={<Activity className="h-4 w-4" />} label="Active users" value={String(cards.activeUsers ?? cards.totalUsers ?? 0)} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">Revenue (30d)</h3>
          <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" } }} className="mt-4 h-72">
            <AreaChart data={charts.salesTrend ?? []}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={50} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revFill)" />
            </AreaChart>
          </ChartContainer>
        </Card>

        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">Users by role</h3>
          <ChartContainer config={{ total: { label: "Users" } }} className="mt-4 h-72">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="role" />} />
              <Pie data={roleData} dataKey="total" nameKey="role" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {roleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ChartContainer>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">Top categories</h3>
          <ChartContainer config={{ total: { label: "Listings", color: "hsl(var(--accent))" } }} className="mt-4 h-64">
            <BarChart data={charts.categoryBreakdown ?? []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={6} />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">Orders by state</h3>
          {stateData.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No regional data yet.</p>
          ) : (
            <ChartContainer config={{ total: { label: "Orders", color: "hsl(var(--primary))" } }} className="mt-4 h-64">
              <BarChart data={stateData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="state" type="category" tickLine={false} axisLine={false} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={6} />
              </BarChart>
            </ChartContainer>
          )}
        </Card>
      </div>
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

export default AdminAnalytics;
