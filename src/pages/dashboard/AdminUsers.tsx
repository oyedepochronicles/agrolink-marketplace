import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Mail, Trash2, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { VerificationBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { useAdminUsers, useDeleteAdminUser } from "@/hooks/useAdmin";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, initials } from "@/lib/format";
import type { User } from "@/types";

interface Row {
  _id: string;
  name: string;
  email: string;
  role: string;
  verification: string;
  joined: number;
  raw: User;
}

const AdminUsers = () => {
  const { t } = useTranslation();
  const { data: users = [], isLoading } = useAdminUsers();
  const del = useDeleteAdminUser();
  const [confirm, setConfirm] = useState<User | null>(null);

  const rows = useMemo<Row[]>(() => users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    verification: u.verificationStatus ?? "—",
    joined: new Date(u.createdAt ?? 0).getTime(),
    raw: u,
  })), [users]);

  const remove = async () => {
    if (!confirm) return;
    try {
      await del.mutateAsync(confirm._id);
      toast.success("User removed");
      setConfirm(null);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    {
      accessorKey: "name",
      header: t("admin.columns.name"),
      cell: ({ row }) => {
        const u = row.original.raw;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={u.profileImage} alt={u.name} />
              <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(u.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{u.name}</p>
              <p className="truncate text-xs text-muted-foreground md:hidden">{u.email}</p>
            </div>
          </div>
        );
      },
    },
    { accessorKey: "email", header: t("admin.columns.email"), cell: ({ row }) => <span className="hidden md:inline">{row.original.email}</span> },
    { accessorKey: "role", header: t("admin.columns.role"), cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.role}</Badge> },
    { accessorKey: "verification", header: t("admin.columns.verification"), cell: ({ row }) => row.original.raw.verificationStatus ? <VerificationBadge status={row.original.raw.verificationStatus} /> : <span className="text-muted-foreground">—</span> },
    { accessorKey: "joined", header: t("admin.columns.joined"), cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.raw.createdAt)}</span> },
    {
      id: "actions",
      header: t("common.actions"),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild aria-label={`Email ${row.original.name}`}>
            <a href={`mailto:${row.original.email}`}><Mail className="h-4 w-4" /></a>
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirm(row.original.raw)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.usersTitle")} description={t("admin.usersDesc")} />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title={t("common.noResults")} />
      ) : (
        <DataTable data={rows} columns={columns} searchableKeys={["name", "email", "role", "verification"]} />
      )}

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this user?</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.name} ({confirm?.email}) will lose access.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.remove")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
