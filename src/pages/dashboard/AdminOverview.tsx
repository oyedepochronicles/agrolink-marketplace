import { Card } from "@/components/ui/card";
import { ShieldCheck, Users, Package, BarChart3 } from "lucide-react";

const AdminOverview = () => (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-2xl font-extrabold tracking-tight">Platform overview</h2>
      <p className="text-sm text-muted-foreground">Monitor verifications, users, and platform health.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-4">
      <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Pending verifications" value="—" />
      <Stat icon={<Users className="h-4 w-4" />} label="Total users" value="—" />
      <Stat icon={<Package className="h-4 w-4" />} label="Listings" value="—" />
      <Stat icon={<BarChart3 className="h-4 w-4" />} label="GMV (30d)" value="₦ —" />
    </div>
    <Card className="rounded-2xl p-6">
      <h3 className="font-semibold">Verification queue</h3>
      <p className="mt-1 text-sm text-muted-foreground">Approve or reject pending farmer & rider applications.</p>
    </Card>
  </div>
);

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <Card className="rounded-2xl p-5 shadow-card">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      {label}
    </div>
    <p className="mt-3 font-display text-3xl font-extrabold">{value}</p>
  </Card>
);

export default AdminOverview;
