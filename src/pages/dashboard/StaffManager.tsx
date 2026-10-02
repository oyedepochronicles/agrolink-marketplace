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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRolesList } from "@/hooks/useRolesAdmin";
import {
  useChangeStaffRole,
  useCreateStaff,
  useStaffActivity,
  useStaffList,
  useStaffMember,
  useUpdateStaff,
  type StaffMember,
} from "@/hooks/useStaffAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { hasPermission, isSuperAdmin } from "@/lib/authz";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal, ShieldCheck, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const ACCOUNT_STATE_STYLES: Record<string, string> = {
  active: "rounded-full border-transparent bg-primary/10 text-primary",
  suspended: "rounded-full border-transparent bg-amber-500/10 text-amber-600",
  deactivated: "rounded-full border-transparent bg-destructive/10 text-destructive",
  deleted: "rounded-full border-transparent bg-muted text-muted-foreground",
};

const fmtDate = (value: unknown): string => {
  if (!value) return "—";
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

const StaffManager = () => {
  const { user } = useAuth();
  const canWrite = hasPermission(user, "staff:write");
  const superAdmin = isSuperAdmin(user);

  const [roleFilter, setRoleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  const { data, isLoading, error } = useStaffList({
    role: roleFilter === "all" ? undefined : roleFilter,
    accountState: stateFilter === "all" ? undefined : stateFilter,
    limit: 200,
  });
  const { data: roles } = useRolesList();

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const changeRole = useChangeStaffRole();

  const staff = data?.items ?? [];

  const roleLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of roles ?? []) map[r.roleKey] = r.name;
    return map;
  }, [roles]);

  // Operational roles that can be assigned from this console. super_admin is only
  // offered to a super_admin; the backend re-enforces this regardless.
  const assignableRoles = useMemo(() => {
    const list = (roles ?? []).filter((r) => r.status === "active" && r.isOperational);
    return superAdmin ? list : list.filter((r) => r.roleKey !== "super_admin");
  }, [roles, superAdmin]);

  const roleOptionsFor = (current?: string) => {
    const opts = assignableRoles.map((r) => ({ key: r.roleKey, name: r.name }));
    if (current && !opts.some((o) => o.key === current)) {
      opts.unshift({ key: current, name: roleLabels[current] ?? current });
    }
    return opts;
  };

  // --- invite ---
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    jobTitle: "",
    employeeId: "",
  });

  const openInvite = () => {
    setInviteForm({
      name: "",
      email: "",
      role: assignableRoles[0]?.roleKey ?? "support",
      department: "",
      jobTitle: "",
      employeeId: "",
    });
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.role) {
      return toast.error("Name, email and role are required");
    }
    try {
      const res = await createStaff.mutateAsync({
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        department: inviteForm.department.trim() || undefined,
        jobTitle: inviteForm.jobTitle.trim() || undefined,
        employeeId: inviteForm.employeeId.trim() || undefined,
      });
      toast.success(`Invitation sent to ${inviteForm.email}`);
      if (res?.inviteUrl) toast.message("Invite link", { description: res.inviteUrl });
      setInviteOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  // --- edit profile ---
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({
    department: "",
    jobTitle: "",
    employeeId: "",
    notes: "",
  });

  const openEdit = (member: StaffMember) => {
    setEditMember(member);
    setEditForm({
      department: member.staffProfile?.department ?? "",
      jobTitle: member.staffProfile?.jobTitle ?? "",
      employeeId: member.staffProfile?.employeeId ?? "",
      notes: member.staffProfile?.notes ?? "",
    });
  };

  const submitEdit = async () => {
    if (!editMember) return;
    try {
      await updateStaff.mutateAsync({
        id: editMember._id,
        department: editForm.department.trim(),
        jobTitle: editForm.jobTitle.trim(),
        employeeId: editForm.employeeId.trim(),
        notes: editForm.notes.trim(),
      });
      toast.success("Staff profile updated");
      setEditMember(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  // --- change role ---
  const [roleMember, setRoleMember] = useState<StaffMember | null>(null);
  const [roleValue, setRoleValue] = useState("");

  const openRole = (member: StaffMember) => {
    setRoleMember(member);
    setRoleValue(member.role);
  };

  const submitRole = async () => {
    if (!roleMember || !roleValue || roleValue === roleMember.role) {
      setRoleMember(null);
      return;
    }
    try {
      await changeRole.mutateAsync({ id: roleMember._id, role: roleValue });
      toast.success("Role updated");
      setRoleMember(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  // --- status transitions ---
  const changeStatus = async (
    member: StaffMember,
    status: "active" | "suspended" | "deactivated",
    message: string,
  ) => {
    try {
      await updateStaff.mutateAsync({ id: member._id, status });
      toast.success(message);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  // --- detail drawer ---
  const [detailId, setDetailId] = useState<string | null>(null);

  /** Can the current actor mutate this row? Mirrors the server escalation floor. */
  const canActOn = (member: StaffMember) => {
    if (!canWrite) return false;
    if (member.role === "super_admin" && !superAdmin) return false;
    return true;
  };
  const isSelf = (member: StaffMember) => member._id === user?._id;

  const columns: ColumnDef<StaffMember, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-full">
          {roleLabels[row.original.role] ?? row.original.role.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.staffProfile?.department || "—"}
        </span>
      ),
    },
    {
      accessorKey: "accountState",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={ACCOUNT_STATE_STYLES[row.original.accountState] ?? "rounded-full"}
        >
          {row.original.accountState}
        </Badge>
      ),
    },
    {
      id: "mfa",
      header: "MFA",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.mfaEnabled ? "Enabled" : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const member = row.original;
        const actable = canActOn(member);
        const self = isSelf(member);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Staff actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailId(member._id)}>
                View details
              </DropdownMenuItem>
              {actable && (
                <>
                  <DropdownMenuItem onClick={() => openEdit(member)}>Edit profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRole(member)} disabled={self}>
                    Change role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {member.accountState === "active" && (
                    <DropdownMenuItem
                      disabled={self}
                      onClick={() => changeStatus(member, "suspended", "Staff suspended")}
                    >
                      Suspend
                    </DropdownMenuItem>
                  )}
                  {member.accountState !== "active" && (
                    <DropdownMenuItem
                      disabled={self}
                      onClick={() => changeStatus(member, "active", "Staff reactivated")}
                    >
                      Reactivate
                    </DropdownMenuItem>
                  )}
                  {member.accountState !== "deactivated" && (
                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={self}
                      onClick={() => changeStatus(member, "deactivated", "Staff deactivated")}
                    >
                      Deactivate
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Manage operational staff, their roles and account state. Administrators are invited from the Admin team page; privilege changes are enforced on the backend."
        action={
          canWrite ? (
            <Button className="rounded-full" onClick={openInvite}>
              <UserPlus className="mr-2 h-4 w-4" /> Invite staff
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {apiErrorMessage(error)}
        </p>
      ) : (
        <DataTable
          data={staff}
          columns={columns}
          searchPlaceholder="Search staff"
          searchableKeys={["name", "email", "role"]}
          emptyMessage="No staff match these filters."
          toolbar={
            <>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {(roles ?? []).map((r) => (
                    <SelectItem key={r.roleKey} value={r.roleKey}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deactivated">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite staff member</DialogTitle>
            <DialogDescription>
              They receive a one-time link, set their own password, and (for admin roles) must enroll
              in MFA before entering the console.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">Full name</Label>
              <Input
                id="staff-name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r.roleKey} value={r.roleKey}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="staff-dept">Department</Label>
                <Input
                  id="staff-dept"
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm((f) => ({ ...f, department: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-title">Job title</Label>
                <Input
                  id="staff-title"
                  value={inviteForm.jobTitle}
                  onChange={(e) => setInviteForm((f) => ({ ...f, jobTitle: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-empid">Employee ID (optional)</Label>
              <Input
                id="staff-empid"
                value={inviteForm.employeeId}
                onChange={(e) => setInviteForm((f) => ({ ...f, employeeId: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={submitInvite} disabled={createStaff.isPending}>
              {createStaff.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit profile dialog */}
      <Dialog open={!!editMember} onOpenChange={(o) => !o && setEditMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editMember?.name}</DialogTitle>
            <DialogDescription>Update employment details for this staff member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-dept">Department</Label>
                <Input
                  id="edit-dept"
                  value={editForm.department}
                  onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Job title</Label>
                <Input
                  id="edit-title"
                  value={editForm.jobTitle}
                  onChange={(e) => setEditForm((f) => ({ ...f, jobTitle: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-empid">Employee ID</Label>
              <Input
                id="edit-empid"
                value={editForm.employeeId}
                onChange={(e) => setEditForm((f) => ({ ...f, employeeId: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditMember(null)}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={submitEdit} disabled={updateStaff.isPending}>
              {updateStaff.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog open={!!roleMember} onOpenChange={(o) => !o && setRoleMember(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Reassign {roleMember?.name}. You can only grant roles within your own authority; the
              backend enforces this.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={roleValue} onValueChange={setRoleValue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptionsFor(roleMember?.role).map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setRoleMember(null)}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={submitRole} disabled={changeRole.isPending}>
              {changeRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <StaffDetailDialog
        staffId={detailId}
        roleLabels={roleLabels}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
};

/** Read-only detail: profile, effective permissions, recent activity + logins. */
const StaffDetailDialog = ({
  staffId,
  roleLabels,
  onClose,
}: {
  staffId: string | null;
  roleLabels: Record<string, string>;
  onClose: () => void;
}) => {
  const { data: member, isLoading } = useStaffMember(staffId ?? undefined, !!staffId);
  const { data: activity } = useStaffActivity(staffId ?? undefined, !!staffId);
  const perms = member?.effectivePermissions ?? [];

  return (
    <Dialog open={!!staffId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member?.name ?? "Staff details"}</DialogTitle>
          <DialogDescription>{member?.email}</DialogDescription>
        </DialogHeader>

        {isLoading || !member ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium">{roleLabels[member.role] ?? member.role}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account state</p>
                <p className="font-medium capitalize">{member.accountState}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium">{member.staffProfile?.department || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Job title</p>
                <p className="font-medium">{member.staffProfile?.jobTitle || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employee ID</p>
                <p className="font-medium">{member.staffProfile?.employeeId || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MFA</p>
                <p className="font-medium">{member.mfaEnabled ? "Enabled" : "Not enabled"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last login</p>
                <p className="font-medium">{fmtDate(member.lastLoginAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="font-medium">
                  {fmtDate(member.staffProfile?.dateJoined ?? member.createdAt)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" /> Effective permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {perms.includes("*") ? (
                  <Badge className="rounded-full">All (super admin)</Badge>
                ) : perms.length ? (
                  perms.map((p) => (
                    <Badge key={p} variant="outline" className="rounded-full font-mono text-[10px]">
                      {p}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No permissions.</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Recent actions</p>
              {activity?.actions?.length ? (
                <ul className="space-y-1.5 text-xs">
                  {activity.actions.slice(0, 15).map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="font-medium">{String(a["action"] ?? "—")}</span>
                      <span className="text-muted-foreground">{fmtDate(a["createdAt"])}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No recorded actions.</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Recent logins</p>
              {activity?.logins?.length ? (
                <ul className="space-y-1.5 text-xs">
                  {activity.logins.slice(0, 10).map((l, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{String(l["ip"] ?? "—")}</span>
                      <span className="text-muted-foreground">{fmtDate(l["createdAt"])}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No recorded logins.</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffManager;
