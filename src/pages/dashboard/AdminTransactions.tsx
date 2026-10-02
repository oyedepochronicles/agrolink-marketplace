import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinanceTransactions, useRevalidateTransaction, type FinanceTransaction } from "@/hooks/useFinance";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { RefreshCw, ReceiptText, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const tone = (status: string) => {
  if (["paid", "provider_confirmed", "completed"].includes(status)) return "border-success/40 bg-success/10 text-success-foreground";
  if (["failed", "verification_failed"].includes(status)) return "border-destructive/40 bg-destructive/10 text-destructive";
  return "border-warning/40 bg-warning/10 text-warning-foreground";
};

const isRevalidatable = (transaction: FinanceTransaction) =>
  (transaction.kind === "order" || transaction.kind === "parent") && transaction.provider === "paystack" && transaction.status !== "paid";

const AdminTransactions = () => {
  const [q, setQ] = useState("");
  const { data: transactions = [], isLoading } = useFinanceTransactions(q.trim() ? { q: q.trim() } : {});
  const revalidate = useRevalidateTransaction();

  const checkProvider = async (transaction: FinanceTransaction) => {
    try {
      const { outcome } = await revalidate.mutateAsync(transaction);
      toast.success(outcome === "success" ? "Provider confirmed payment" : `Provider result: ${outcome.replace("_", " ")}`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Payment and settlement records. Revalidation always checks Paystack; it never changes a status from this screen alone." />
      <div className="flex max-w-md items-center gap-2 rounded-xl border border-border bg-card px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Reference, order, customer…" className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
      </div>
      <Card className="overflow-hidden rounded-2xl shadow-card">
        {isLoading ? <Skeleton className="m-5 h-52" /> : transactions.length === 0 ? (
          <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="No transactions found" description="Payments and settlements will appear here as they are created." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Provider</TableHead><TableHead>Status</TableHead><TableHead>Reconciliation</TableHead><TableHead className="text-right">Amount</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>{transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(transaction.createdAt)}</TableCell>
                  <TableCell className="max-w-44 truncate font-mono text-xs">{transaction.reference ?? "—"}</TableCell>
                  <TableCell><p className="text-sm font-medium">{transaction.user?.name ?? "—"}</p><p className="max-w-40 truncate text-xs text-muted-foreground">{transaction.user?.email}</p></TableCell>
                  <TableCell className="capitalize">{transaction.transactionType}</TableCell>
                  <TableCell className="capitalize">{transaction.provider ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={tone(transaction.status)}>{transaction.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={tone(transaction.reconciliationStatus)}>{transaction.reconciliationStatus.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{formatNaira(transaction.amount)}</TableCell>
                  <TableCell className="text-right">{isRevalidatable(transaction) && <Button size="sm" variant="outline" onClick={() => checkProvider(transaction)} disabled={revalidate.isPending}><RefreshCw className={`mr-1 h-3.5 w-3.5 ${revalidate.isPending ? "animate-spin" : ""}`} />Revalidate</Button>}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminTransactions;
