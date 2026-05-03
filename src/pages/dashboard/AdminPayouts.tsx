import { CheckCircle2, XCircle, Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAdminPayouts, useReviewPayout } from "@/hooks/useWallet";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { toast } from "sonner";

const AdminPayouts = () => {
  const { data: payouts = [], isLoading } = useAdminPayouts();
  const review = useReviewPayout();

  const act = async (id: string, action: "approve" | "reject" | "mark_paid") => {
    try {
      await review.mutateAsync({ id, action });
      toast.success(action === "mark_paid" ? "Marked as paid" : `Payout ${action}d`);
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payouts" description="Approve and process payout requests from farmers and riders." />
      <Card className="rounded-2xl p-5 shadow-card">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : payouts.length === 0 ? (
          <EmptyState icon={<Banknote className="h-6 w-6" />} title="No payout requests" description="When users request payouts, they will appear here for review." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="whitespace-nowrap">{formatDate(p.createdAt)}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{p.user?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.bankAccount?.bankName}<br />
                    <span className="text-xs text-muted-foreground">{p.bankAccount?.accountNumber} • {p.bankAccount?.accountName}</span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{p.status}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{formatNaira(p.amount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {p.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => act(p._id, "reject")}>
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                          </Button>
                          <Button size="sm" onClick={() => act(p._id, "approve")}>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                          </Button>
                        </>
                      )}
                      {p.status === "processing" && (
                        <Button size="sm" onClick={() => act(p._id, "mark_paid")}>
                          <Banknote className="mr-1 h-3.5 w-3.5" /> Mark paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminPayouts;
