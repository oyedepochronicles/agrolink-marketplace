import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminTeam,
  useInviteAdmin,
  useResendAdminInvite,
  useResetUserMfa,
  useSetAdminActive,
} from "@/hooks/useSecurity";
import { apiErrorMessage } from "@/lib/api";
import type { Role, User } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Row {
  id: string;
  name: string;
  email: string;
  role: string;
  mfa: string;
  state: string;
  raw: User;
}

const AdminTeam = () => {
  const { data, isLoading, error } = useAdminTeam();
  const invite = useInviteAdmin();
  const resend = useResendAdminInvite();
  const setActive = useSetAdminActive();
  const resetMfa = useResetUserMfa();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: Extract<Role, "admin" | "super_admin"> }>({
    name: "",
    email: "",
    role: "admin",
  });

  const rows: Row[] = useMemo(
    () =>
      (data ?? []).map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        mfa: u.mfaEnabled ? "Enabled" : "Not enabled",
        state: u.isDeactivated ? "Deactivated" : u.inviteStatus === "pending" ? "Invite pending" : "Active",
        raw: u,
      })),
    [data],
  );

  const run = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      toast.success(message);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const submitInvite = async () => {
    try {
      const res = await invite.mutateAsync(form);
      toast.success(`Invitation sent to ${form.email}`);
      if (res?.inviteUrl) toast.message("Invite link", { description: res.inviteUrl });
      setOpen(false);
      setForm({ name: "", email: "", role: "admin" });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const columns: ColumnDef<Row, unknown>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-full capitalize">
            {row.original.role.replace("_", " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "mfa",
        header: "MFA",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.mfa === "Enabled"
                ? "rounded-full border-transparent bg-primary/10 text-primary"
                : "rounded-full border-transparent bg-destructive/10 text-destructive"
            }
          >
            {row.original.mfa}
          </Badge>
        ),
      },
      { accessorKey: "state", header: "Status" },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const u = row.original.raw;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => run(() => resend.mutateAsync(u._id), "Invitation resent")}>
                  Resend invitation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => run(() => resetMfa.mutateAsync(u._id), "MFA reset")}>
                  Reset MFA
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() =>
                    run(
                      () => setActive.mutateAsync({ id: u._id, active: !!u.isDeactivated }),
                      u.isDeactivated ? "Account reactivated" : "Account deactivated",
                    )
                  }
                >
                  {u.isDeactivated ? "Reactivate" : "Deactivate"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [resend, resetMfa, setActive],
  );

  if (isLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin team"
        description="Administrators exist only by invitation from a super admin. Self-signup is never possible."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <UserPlus className="mr-2 h-4 w-4" /> Invite admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite an administrator</DialogTitle>
                <DialogDescription>
                  They receive a one-time link, set their own password and must enroll in MFA before entering the console.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-name">Full name</Label>
                  <Input
                    id="invite-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm((f) => ({ ...f, role: v as typeof f.role }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={submitInvite}
                  disabled={invite.isPending || !form.name || !form.email}
                  className="rounded-full"
                >
                  {invite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{apiErrorMessage(error)}</p>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Search admins"
          searchableKeys={["name", "email", "role", "state"]}
          emptyMessage="No administrators yet."
        />
      )}
    </div>
  );
};

export default AdminTeam;
