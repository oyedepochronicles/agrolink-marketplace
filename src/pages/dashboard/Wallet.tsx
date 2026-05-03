import { ArrowDownToLine, ArrowUpRight, Wallet as WalletIcon, Hourglass, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { PayoutRequestDialog } from "@/components/dashboard/PayoutRequestDialog";
import { useMyPayouts, useWalletSummary, useWalletTransactions } from "@/hooks/useWallet";
import { formatDate, formatNaira } from "@/lib/format";

const Wallet = () => {
  const { data: summary, isLoading: loadingSummary } = useWalletSummary();
  const { data: txs = [], isLoading: loadingTx } = useWalletTransactions();
  const { data: payouts = [], isLoading: loadingPayouts } = useMyPayouts();

  const balance = summary?.balance ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet & payouts"
        description="Track your balance, transactions, and payout requests."
        action={
          <PayoutRequestDialog
            available={balance}
            trigger={
              <Button className="rounded-xl">
                <ArrowDownToLine className="mr-2 h-4 w-4" /> Request payout
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <BalanceCard icon={<WalletIcon className="h-4 w-4" />} label="Available" value={formatNaira(balance)} loading={loadingSummary} highlight />
        <BalanceCard icon={<Hourglass className="h-4 w-4" />} label="Pending" value={formatNaira(summary?.pending ?? 0)} loading={loadingSummary} />
        <BalanceCard icon={<Sparkles className="h-4 w-4" />} label="Lifetime earnings" value={formatNaira(summary?.lifetimeEarnings ?? 0)} loading={loadingSummary} />
        <BalanceCard icon={<ArrowUpRight className="h-4 w-4" />} label="Lifetime payouts" value={formatNaira(summary?.lifetimePayouts ?? 0)} loading={loadingSummary} />
      </div>

      <Card className="rounded-2xl p-5 shadow-card">
        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            {loadingTx ? (
              <Skeleton className="h-40 w-full" />
            ) : txs.length === 0 ? (
              <EmptyState icon={<WalletIcon className="h-6 w-6" />} title="No transactions yet" description="Your wallet activity will appear here as orders complete." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txs.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell className="whitespace-nowrap">{formatDate(t.createdAt)}</TableCell>
                      <TableCell className="text-sm">{t.description ?? t.reference ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={t.type} /></TableCell>
                      <TableCell className={`text-right font-semibold ${t.type === "credit" ? "text-primary" : "text-foreground"}`}>
                        {t.type === "credit" ? "+" : "-"}{formatNaira(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="payouts" className="mt-4">
            {loadingPayouts ? (
              <Skeleton className="h-40 w-full" />
            ) : payouts.length === 0 ? (
              <EmptyState icon={<ArrowDownToLine className="h-6 w-6" />} title="No payouts yet" description="Request a payout to transfer funds to your bank account." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="whitespace-nowrap">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-sm">
                        {p.bankAccount?.bankName} • {p.bankAccount?.accountNumber}
                      </TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right font-semibold">{formatNaira(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

const BalanceCard = ({ icon, label, value, loading, highlight }: { icon: React.ReactNode; label: string; value: string; loading?: boolean; highlight?: boolean }) => (
  <Card className={`rounded-2xl p-5 shadow-card ${highlight ? "bg-gradient-primary text-white shadow-glow" : ""}`}>
    <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${highlight ? "text-white/80" : "text-muted-foreground"}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${highlight ? "bg-white/20" : "bg-primary/10 text-primary"}`}>{icon}</span>
      {label}
    </div>
    {loading ? <Skeleton className="mt-3 h-8 w-32" /> : <p className="mt-3 font-display text-3xl font-extrabold">{value}</p>}
  </Card>
);

export default Wallet;
