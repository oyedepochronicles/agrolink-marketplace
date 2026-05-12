import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { formatNaira } from "@/lib/format";
import { ArrowUpRight, Box, ShoppingCart, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";

const FarmerOverview = () => {
  const { user } = useAuth();
  const { data: analytics } = useDashboardAnalytics();
  const pending = user?.verificationStatus === "pending";
  const cards = analytics?.cards ?? {};
  const charts = analytics?.charts ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          Welcome back, {user?.name.split(" ")[0]}
        </h2>
        <p className="text-sm text-muted-foreground">
          Here's how your farm is doing today.
        </p>
      </div>

      {pending && (
        <Card className="rounded-2xl border-warning/30 bg-warning/5 p-5">
          <Badge className="bg-warning/20 text-warning-foreground hover:bg-warning/20">
            Pending verification
          </Badge>
          <p className="mt-2 text-sm text-foreground">
            Your account is under review. You'll be able to list products and
            receive orders once approved by our team.
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Box className="h-4 w-4" />}
          label="Active products"
          value={String(cards.activeProducts ?? "-")}
          hint={`${cards.totalProducts ?? 0} total listings`}
        />
        <StatCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Orders this month"
          value={String(cards.ordersThisMonth ?? "-")}
          hint={`${cards.pendingOrders ?? 0} pending`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Wallet balance"
          value={formatNaira(cards.walletBalance ?? 0)}
          hint={`${formatNaira(cards.grossSales ?? 0)} gross sales`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr] overflow-y-auto">
        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">Sales trend</h3>
          <ChartContainer
            config={{
              revenue: { label: "Revenue", color: "hsl(var(--primary))" },
            }}
            className="mt-4 h-64"
          >
            <LineChart data={charts.salesTrend ?? []}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </Card>
        <Card className="rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold">Listings by category</h3>
          <ChartContainer
            config={{
              total: { label: "Listings", color: "hsl(var(--accent))" },
            }}
            className="mt-4 h-64"
          >
            <BarChart data={charts.categoryBreakdown ?? []}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={6} />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <Card className="rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Product management</h3>
            <p className="text-sm text-muted-foreground">
              Add, edit, and manage your listings.
            </p>
          </div>
          <Link
            to="/dashboard/farmer/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Manage products <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>

      <Card className="rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Recent orders</h3>
            <p className="text-sm text-muted-foreground">
              Track and fulfil incoming orders.
            </p>
          </div>
          <Link
            to="/dashboard/farmer/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View orders <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) => (
  <Card className="rounded-2xl p-5 shadow-card">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      {label}
    </div>
    <p className="mt-3 font-display text-3xl font-extrabold">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
  </Card>
);

export default FarmerOverview;
