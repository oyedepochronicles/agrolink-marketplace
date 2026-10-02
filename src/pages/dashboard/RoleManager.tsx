import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateRole,
  useDeleteRole,
  useDuplicateRole,
  useRoleCatalog,
  useRolesList,
  useSetRoleStatus,
  useUpdateRole,
  type RoleCatalog,
  type RoleItem,
} from "@/hooks/useRolesAdmin";
import { apiErrorMessage } from "@/lib/api";
import { isSuperAdmin } from "@/lib/authz";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, Loader2, MoreHorizontal, Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type RoleFormState = {
  roleKey: string;
  name: string;
  description: string;
  permissions: string[];
  isOperational: boolean;
};

const EMPTY_FORM: RoleFormState = {
  roleKey: "",
  name: "",
  description: "",
  permissions: [],
  isOperational: true,
};

/** Grouped, catalog-driven permission checklist. Only tokens the server marks
 * grantable are ever offered — reserved super_admin powers never appear here. */
const PermissionPicker = ({
  catalog,
  selected,
  onChange,
}: {
  catalog: RoleCatalog;
  selected: string[];
  onChange: (next: string[]) => void;
}) => {
  const selectedSet = new Set(selected);
  const groups = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    for (const token of catalog.grantableTokens) {
      const domain = token.split(":")[0] || "other";
      (grouped[domain] ??= []).push(token);
    }
    return grouped;
  }, [catalog.grantableTokens]);

  const toggle = (token: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(token);
    else next.delete(token);
    onChange(Array.from(next));
  };

  return (
    <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-border p-3">
      {Object.entries(groups).map(([domain, tokens]) => (
        <div key={domain} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {domain}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {tokens.map((token) => (
              <label key={token} className="flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={selectedSet.has(token)}
                  onCheckedChange={(c) => toggle(token, c === true)}
                />
                <span className="leading-tight">
                  <span className="font-medium">{catalog.permissions[token] ?? token}</span>
                  <span className="block font-mono text-[10px] text-muted-foreground">{token}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const RoleManager = () => {
  const { user } = useAuth();
  const canWrite = isSuperAdmin(user);

  const { data: roles, isLoading, error } = useRolesList();
  const { data: catalog } = useRoleCatalog(canWrite);

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const duplicateRole = useDuplicateRole();
  const setStatus = useSetRoleStatus();
  const deleteRole = useDeleteRole();

  // create / edit share one dialog (both need the permission picker)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);

  // duplicate has its own lightweight dialog
  const [dupOpen, setDupOpen] = useState(false);
  const [dupSource, setDupSource] = useState<RoleItem | null>(null);
  const [dupForm, setDupForm] = useState({ roleKey: "", name: "", description: "" });

  const openCreate = () => {
    setEditorMode("create");
    setEditingKey(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (role: RoleItem) => {
    setEditorMode("edit");
    setEditingKey(role.roleKey);
    setForm({
      roleKey: role.roleKey,
      name: role.name,
      description: role.description ?? "",
      permissions: [...(role.permissions ?? [])],
      isOperational: role.isOperational,
    });
    setEditorOpen(true);
  };

  const openDuplicate = (role: RoleItem) => {
    setDupSource(role);
    setDupForm({ roleKey: "", name: `${role.name} (copy)`, description: role.description ?? "" });
    setDupOpen(true);
  };

  const submitEditor = async () => {
    const roleKey = form.roleKey.trim().toLowerCase().replace(/\s+/g, "_");
    const name = form.name.trim();
    if (!name) return toast.error("Role name is required");
    try {
      if (editorMode === "create") {
        if (!roleKey) return toast.error("Role key is required");
        await createRole.mutateAsync({
          roleKey,
          name,
          description: form.description.trim() || undefined,
          permissions: form.permissions,
          isOperational: form.isOperational,
        });
        toast.success(`Role "${name}" created`);
      } else if (editingKey) {
        await updateRole.mutateAsync({
          roleKey: editingKey,
          name,
          description: form.description.trim(),
          permissions: form.permissions,
          isOperational: form.isOperational,
        });
        toast.success(`Role "${name}" updated`);
      }
      setEditorOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const submitDuplicate = async () => {
    if (!dupSource) return;
    const roleKey = dupForm.roleKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!roleKey) return toast.error("New role key is required");
    try {
      await duplicateRole.mutateAsync({
        sourceKey: dupSource.roleKey,
        roleKey,
        name: dupForm.name.trim() || undefined,
        description: dupForm.description.trim() || undefined,
      });
      toast.success(`Role duplicated to "${roleKey}"`);
      setDupOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const toggleStatus = async (role: RoleItem) => {
    const status = role.status === "active" ? "disabled" : "active";
    try {
      await setStatus.mutateAsync({ roleKey: role.roleKey, status });
      toast.success(status === "active" ? "Role enabled" : "Role disabled");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const removeRole = async (role: RoleItem) => {
    if (
      !window.confirm(
        `Delete role "${role.name}"? This cannot be undone. Roles held by any user cannot be deleted.`,
      )
    )
      return;
    try {
      await deleteRole.mutateAsync(role.roleKey);
      toast.success(`Role "${role.name}" deleted`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const permissionSummary = (role: RoleItem) => {
    const eff = role.effectivePermissions ?? role.permissions ?? [];
    if (eff.includes("*")) return "All (super admin)";
    return `${eff.length} permission${eff.length === 1 ? "" : "s"}`;
  };

  const columns: ColumnDef<RoleItem, unknown>[] = [
    {
      accessorKey: "name",
      header: "Role",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="font-medium">{row.original.name}</p>
          {row.original.description ? (
            <p className="text-xs text-muted-foreground">{row.original.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "roleKey",
      header: "Key",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.roleKey}</span>
      ),
    },
    {
      id: "kind",
      header: "Type",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="rounded-full">
            {row.original.isSystem ? "Built-in" : "Custom"}
          </Badge>
          {row.original.isOperational ? (
            <Badge variant="outline" className="rounded-full border-transparent bg-secondary">
              Operational
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.status === "active"
              ? "rounded-full border-transparent bg-primary/10 text-primary"
              : "rounded-full border-transparent bg-muted text-muted-foreground"
          }
        >
          {row.original.status === "active" ? "Active" : "Disabled"}
        </Badge>
      ),
    },
    {
      accessorKey: "userCount",
      header: "Users",
      cell: ({ row }) => <span className="tabular-nums">{row.original.userCount ?? 0}</span>,
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{permissionSummary(row.original)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const role = row.original;
        if (!canWrite) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Role actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!role.isSystem && (
                <DropdownMenuItem onClick={() => openEdit(role)}>Edit permissions</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => openDuplicate(role)}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              {!role.isSystem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toggleStatus(role)}>
                    {role.status === "active" ? "Disable role" : "Enable role"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => removeRole(role)}
                    disabled={role.userCount > 0}
                  >
                    Delete role
                  </DropdownMenuItem>
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
        title="Operational roles"
        description="Create and manage operational roles and their permissions. Built-in roles can be duplicated but not renamed; their base permissions are edited from Platform config → Permissions. Only a super admin can change roles."
        action={
          canWrite ? (
            <Button className="rounded-full" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New role
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
          data={roles ?? []}
          columns={columns}
          searchPlaceholder="Search roles"
          searchableKeys={["name", "roleKey", "description"]}
          emptyMessage="No roles defined yet."
        />
      )}

      {/* Create / edit dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editorMode === "create" ? "Create role" : `Edit ${form.name}`}</DialogTitle>
            <DialogDescription>
              Grant only the permissions this role needs. Super-admin-only powers are never offered
              and are enforced on the backend.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="role-key">Role key</Label>
                <Input
                  id="role-key"
                  value={form.roleKey}
                  disabled={editorMode === "edit"}
                  placeholder="e.g. dispatch_lead"
                  onChange={(e) => setForm((f) => ({ ...f, roleKey: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">
                  Lowercase identifier, permanent once created.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Display name</Label>
                <Input
                  id="role-name"
                  value={form.name}
                  placeholder="e.g. Dispatch Lead"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc">Description</Label>
              <Textarea
                id="role-desc"
                value={form.description}
                rows={2}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <Label className="text-sm">Operational role</Label>
                <p className="text-[11px] text-muted-foreground">
                  Operational roles appear in the staff console and can be assigned to staff.
                </p>
              </div>
              <Switch
                checked={form.isOperational}
                onCheckedChange={(c) => setForm((f) => ({ ...f, isOperational: c }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Permissions
              </Label>
              {catalog ? (
                <PermissionPicker
                  catalog={catalog}
                  selected={form.permissions}
                  onChange={(permissions) => setForm((f) => ({ ...f, permissions }))}
                />
              ) : (
                <Skeleton className="h-40 w-full rounded-xl" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full"
              onClick={submitEditor}
              disabled={createRole.isPending || updateRole.isPending}
            >
              {(createRole.isPending || updateRole.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editorMode === "create" ? "Create role" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate dialog */}
      <Dialog open={dupOpen} onOpenChange={setDupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate role</DialogTitle>
            <DialogDescription>
              Copies the permissions of <span className="font-medium">{dupSource?.name}</span> into a
              new custom role you can then edit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dup-key">New role key</Label>
              <Input
                id="dup-key"
                value={dupForm.roleKey}
                placeholder="e.g. dispatch_lead_2"
                onChange={(e) => setDupForm((f) => ({ ...f, roleKey: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dup-name">Display name</Label>
              <Input
                id="dup-name"
                value={dupForm.name}
                onChange={(e) => setDupForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dup-desc">Description</Label>
              <Textarea
                id="dup-desc"
                rows={2}
                value={dupForm.description}
                onChange={(e) => setDupForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setDupOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={submitDuplicate} disabled={duplicateRole.isPending}>
              {duplicateRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManager;
