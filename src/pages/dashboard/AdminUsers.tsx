import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { VerificationBadge } from "@/components/dashboard/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdminUsers,
  useDeleteAdminUser,
  useInviteAdminUser,
  useUpdateAdminUserDeactivation,
  useUpdateAdminUserSuspension,
} from "@/hooks/useAdmin";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Role, User } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Loader2,
  Mail,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
  UserX,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type AccountState = "active" | "suspended" | "deactivated";
type AdminInviteRole = Extract<Role, "admin" | "super_admin">;

interface Row {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  state: string;
  accountState: AccountState;
  verification: string;
  joined: number;
  raw: User;
}

const accountState = (user: User): AccountState => {
  if (user.isDeactivated || user.accountState === "deactivated")
    return "deactivated";
  if (user.isSuspended || user.accountState === "suspended") return "suspended";
  return "active";
};

const ACCOUNT_STYLES: Record<AccountState, string> = {
  active: "bg-primary/15 text-primary",
  suspended: "bg-warning/15 text-warning-foreground",
  deactivated: "bg-destructive/10 text-destructive",
};

const AccountBadge = ({ state }: { state: AccountState }) => (
  <Badge
    variant="outline"
    className={cn(
      "rounded-full border-transparent capitalize",
      ACCOUNT_STYLES[state],
    )}
  >
    {state}
  </Badge>
);

const Detail = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div>
    <p className="text-xs font-medium uppercase text-muted-foreground">
      {label}
    </p>
    <div className="mt-1 text-sm">{value || "-"}</div>
  </div>
);

const AdminUsers = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading } = useAdminUsers();
  const del = useDeleteAdminUser();
  const suspend = useUpdateAdminUserSuspension();
  const deactivate = useUpdateAdminUserDeactivation();
  const inviteAdmin = useInviteAdminUser();
  const [confirm, setConfirm] = useState<User | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "admin" as AdminInviteRole,
  });

  const rows = useMemo<Row[]>(
    () =>
      users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone || "-",
        role: u.role,
        state:
          u.location?.state || u.state || u.farmerProfile?.farmState || "-",
        accountState: accountState(u),
        verification: u.verificationStatus ?? "-",
        joined: new Date(u.createdAt ?? 0).getTime(),
        raw: u,
      })),
    [users],
  );

  const remove = async () => {
    if (!confirm) return;
    try {
      await del.mutateAsync(confirm._id);
      toast.success("User removed");
      setConfirm(null);
      setSelected((current) => (current?._id === confirm._id ? null : current));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const setSuspended = useCallback(
    async (user: User, isSuspended: boolean) => {
      try {
        const updated = await suspend.mutateAsync({
          id: user._id,
          isSuspended,
        });
        toast.success(isSuspended ? "User suspended" : "User restored");
        setSelected((current) =>
          current?._id === user._id ? updated : current,
        );
      } catch (e) {
        toast.error(apiErrorMessage(e));
      }
    },
    [suspend],
  );

  const setDeactivated = useCallback(
    async (user: User, isDeactivated: boolean) => {
      try {
        const updated = await deactivate.mutateAsync({
          id: user._id,
          isDeactivated,
        });
        toast.success(isDeactivated ? "User deactivated" : "User reactivated");
        setSelected((current) =>
          current?._id === user._id ? updated : current,
        );
      } catch (e) {
        toast.error(apiErrorMessage(e));
      }
    },
    [deactivate],
  );

  const submitInvite = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await inviteAdmin.mutateAsync(inviteForm);
      toast.success("Admin invite sent");
      setInviteForm({ name: "", email: "", role: "admin" });
      setInviteOpen(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const actionMenu = useCallback(
    (user: User) => {
      const state = accountState(user);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${user.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem onClick={() => setSelected(user)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`mailto:${user.email}`}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={suspend.isPending}
              onClick={() => setSuspended(user, state !== "suspended")}
            >
              {state === "suspended" ? (
                <PlayCircle className="mr-2 h-4 w-4" />
              ) : (
                <PauseCircle className="mr-2 h-4 w-4" />
              )}
              {state === "suspended" ? "Restore" : "Suspend"}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={deactivate.isPending}
              onClick={() => setDeactivated(user, state !== "deactivated")}
            >
              {state === "deactivated" ? (
                <PlayCircle className="mr-2 h-4 w-4" />
              ) : (
                <UserX className="mr-2 h-4 w-4" />
              )}
              {state === "deactivated" ? "Reactivate" : "Deactivate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirm(user)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [deactivate.isPending, setDeactivated, setSuspended, suspend.isPending],
  );

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("admin.columns.name"),
        cell: ({ row }) => {
          const u = row.original.raw;
          return (
            <div className="flex min-w-[220px] items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={u.profileImage} alt={u.name} />
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials(u.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground md:hidden">
                  {u.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: t("admin.columns.email"),
        cell: ({ row }) => (
          <span className="hidden md:inline">{row.original.email}</span>
        ),
      },
      { accessorKey: "phone", header: "Phone" },
      {
        accessorKey: "role",
        header: t("admin.columns.role"),
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "accountState",
        header: "Account",
        cell: ({ row }) => <AccountBadge state={row.original.accountState} />,
      },
      {
        accessorKey: "verification",
        header: t("admin.columns.verification"),
        cell: ({ row }) =>
          row.original.raw.verificationStatus ? (
            <VerificationBadge status={row.original.raw.verificationStatus} />
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      { accessorKey: "state", header: t("auth.state") },
      {
        accessorKey: "joined",
        header: t("admin.columns.joined"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.raw.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("common.actions"),
        enableSorting: false,
        cell: ({ row }) => actionMenu(row.original.raw),
      },
    ],
    [actionMenu, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.usersTitle")}
        description={t("admin.usersDesc")}
        action={
          currentUser?.role === "super_admin" ? (
            <Button onClick={() => setInviteOpen(true)}>
              <Plus className="h-4 w-4" /> Add admin user
            </Button>
          ) : undefined
        }
      />
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={t("common.noResults")}
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchableKeys={[
            "name",
            "email",
            "phone",
            "role",
            "verification",
            "accountState",
            "state",
          ]}
          onRowClick={(row) => setSelected(row.raw)}
        />
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Add admin user</DialogTitle>
            <DialogDescription>
              Send an invite so the admin can set their password and activate
              access.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitInvite}>
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                value={inviteForm.name}
                onChange={(event) =>
                  setInviteForm((form) => ({
                    ...form,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={inviteForm.email}
                onChange={(event) =>
                  setInviteForm((form) => ({
                    ...form,
                    email: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(role: AdminInviteRole) =>
                  setInviteForm((form) => ({ ...form, role }))
                }
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={inviteAdmin.isPending}>
                {inviteAdmin.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Send invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl rounded-xl">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={selected.profileImage}
                    alt={selected.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials(selected.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selected.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {selected.role}
                    </Badge>
                    <AccountBadge state={accountState(selected)} />
                    {selected.verificationStatus ? (
                      <VerificationBadge status={selected.verificationStatus} />
                    ) : null}
                  </div>
                </div>
                <div className="ml-auto">{actionMenu(selected)}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Email" value={selected.email} />
                <Detail label="Phone" value={selected.phone} />
                <Detail
                  label="State"
                  value={
                    selected.location?.state ||
                    selected.state ||
                    selected.farmerProfile?.farmState
                  }
                />
                <Detail label="Joined" value={formatDate(selected.createdAt)} />
                <Detail
                  label="Farm name"
                  value={selected.farmerProfile?.farmName}
                />
                <Detail
                  label="Farm address"
                  value={
                    selected.farmerProfile?.farmAddress ||
                    selected.location?.fullAddress
                  }
                />
                <Detail
                  label="Rider vehicle"
                  value={selected.riderProfile?.vehicleType}
                />
                <Detail
                  label="Rating"
                  value={
                    selected.avgRating
                      ? `${selected.avgRating} (${selected.ratingsCount || 0})`
                      : undefined
                  }
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.name} ({confirm?.email}) will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
