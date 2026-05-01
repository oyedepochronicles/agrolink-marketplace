import { useMemo, useState } from "react";
import { Loader2, Search, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { VerificationBadge } from "@/components/dashboard/StatusBadge";
import { useAdminUsers, useDeleteAdminUser } from "@/hooks/useAdmin";
import { formatDate, initials } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api";
import type { User } from "@/types";

const AdminUsers = () => {
  const { data: users = [], isLoading } = useAdminUsers();
  const del = useDeleteAdminUser();
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<User | null>(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const k = q.toLowerCase();
    return users.filter((u) =>
      u.name.toLowerCase().includes(k) ||
      u.email.toLowerCase().includes(k) ||
      u.role.toLowerCase().includes(k)
    );
  }, [users, q]);

  const remove = async () => {
    if (!confirm) return;
    try { await del.mutateAsync(confirm._id); toast.success("User removed"); setConfirm(null); }
    catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="All accounts on the platform." />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, email, role…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No users found" />
      ) : (
        <Card className="rounded-2xl p-2 shadow-card">
          <ul className="divide-y">
            {filtered.map((u) => (
              <li key={u._id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary">{initials(u.name)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant="outline" className="capitalize">{u.role}</Badge>
                {u.verificationStatus && <VerificationBadge status={u.verificationStatus} />}
                <span className="hidden text-xs text-muted-foreground md:inline">{formatDate(u.createdAt)}</span>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirm(u)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.name} ({confirm?.email}) will lose access to PhyhanAgro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
