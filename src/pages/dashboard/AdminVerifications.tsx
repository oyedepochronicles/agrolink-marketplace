import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAdminVerifications, useReviewVerification } from "@/hooks/useAdmin";
import { initials } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api";

const AdminVerifications = () => {
  const { data: pending = [], isLoading } = useAdminVerifications();
  const review = useReviewVerification();

  const act = async (id: string, action: "approve" | "reject") => {
    try {
      await review.mutateAsync({ id, action });
      toast.success(action === "approve" ? "Account approved" : "Application rejected");
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Verification queue" description="Review and approve farmer & rider applications." />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : pending.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="Nothing to review"
          description="All caught up! New applications will appear here." />
      ) : (
        <div className="grid gap-3">
          {pending.map((u) => (
            <Card key={u._id} className="rounded-2xl p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">{initials(u.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{u.name}</p>
                    <Badge variant="outline" className="capitalize">{u.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email} {u.phone && `• ${u.phone}`} {u.state && `• ${u.state}`}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => act(u._id, "reject")} disabled={review.isPending}>
                    <ShieldX className="h-4 w-4" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => act(u._id, "approve")} disabled={review.isPending}>
                    <ShieldCheck className="h-4 w-4" /> Approve
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
