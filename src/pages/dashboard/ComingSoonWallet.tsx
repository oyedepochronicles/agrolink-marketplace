import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

const ComingSoonWallet = () => (
  <div className="space-y-6">
    <PageHeader title="Wallet & earnings" description="Track payouts and balances." />
    <Card className="flex flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow">
        <Wallet className="h-6 w-6" />
      </span>
      <p className="font-semibold">Wallet coming soon</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Withdrawals to your bank, transaction history, and earnings analytics will live here.
      </p>
    </Card>
  </div>
);

export default ComingSoonWallet;
