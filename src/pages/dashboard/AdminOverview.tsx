import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowUpRight, BarChart3, Package, ShieldCheck, Users } from "lucide-react";
import { useAdminStats, useAdminVerifications } from "@/hooks/useAdmin";
import { formatNaira } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/PageHeader";

const AdminOverview = () => {
  const { data: stats = {} } = useAdminStats();
  const { data: pending = [] } = useAdminVerifications();

  const num = (key: string) => (typeof stats[key] === "number" ? String(stats[key]) : "—");
  const money = (key: string) => (typeof stats[key] === "number" ? formatNaira(stats[key] as number) : "₦ —");

  return (
    <div className="space-y-6">
      <PageHeader title="Platform overview" description="Monitor verifications, users, and platform health." />

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Pending verifications" value={String(pending.length || num("pendingVerifications"))} to="/dashboard/admin/verifications" />
        <Stat icon={<Users className="h-4 w-4" />} label="Total users" value={num("totalUsers")} to="/dashboard/admin/users" />
        <Stat icon={<Package className="h-4 w-4" />} label="Listings" value={num("totalProducts")} to="/dashboard/admin/products" />
        <Stat icon={<BarChart3 className="h-4 w-4" />} label="GMV (30d)" value={money("gmv30d")} />
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
