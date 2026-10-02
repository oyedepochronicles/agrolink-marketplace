import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdminConfigItems,
  useBulkUpdateConfig,
  useCreateConfigKey,
  useDeleteConfigKey,
  usePermissionCatalog,
  usePermissionMatrix,
  useResetConfigKey,
  useResetPermissionMatrix,
  useUpdateConfigKey,
  useUpdatePermissionMatrix,
  type PermissionMatrix,
} from "@/hooks/useSystemConfigAdmin";
import { apiErrorMessage } from "@/lib/api";
import { isSuperAdmin } from "@/lib/authz";
import {
  CONFIG_CATEGORIES,
  CONFIG_VALUE_TYPES,
  type ConfigItem,
  type ConfigType,
} from "@/types/config";
import { Check, Loader2, Plus, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/** Coerce a raw string from a form control into the declared value type. Throws on bad JSON. */
const parseValueForType = (raw: string, type: ConfigType): unknown => {
  switch (type) {
    case "number":
      return raw.trim() === "" ? 0 : Number(raw);
    case "boolean":
      return raw === "true";
    case "json":
    case "array":
      return JSON.parse(raw);
    default:
      return raw;
  }
};

const AdminConfig = () => {
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform configuration"
        description="Typed settings and the role→permission matrix. Changes take effect platform-wide."
      />
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          {superAdmin && (
            <TabsTrigger value="permissions">Permissions (RBAC)</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>
        {superAdmin && (
          <TabsContent value="permissions" className="mt-6">
            <PermissionsTab enabled={superAdmin} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

/* ------------------------------------------------------------------ settings */

const SettingsTab = () => {
  const { data: items = [], isLoading } = useAdminConfigItems();
  const bulk = useBulkUpdateConfig();
  const reset = useResetConfigKey();
  const update = useUpdateConfigKey();
  const del = useDeleteConfigKey();
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const seed: Record<string, unknown> = {};
    for (const it of items) seed[it.key] = it.value;
    setDraft(seed);
  }, [items]);

  const grouped = useMemo(() => {
    const map: Record<string, ConfigItem[]> = {};
    for (const it of items) (map[it.category] ||= []).push(it);
    return map;
  }, [items]);

  const dirty = useMemo(
    () =>
      items.filter(
        (it) => !it.protected && draft[it.key] !== it.value,
      ),
    [items, draft],
  );

  const save = async () => {
    if (!dirty.length) return;
    try {
      await bulk.mutateAsync(
        dirty.map((it) => ({
          key: it.key,
          value: draft[it.key],
          category: it.category,
          description: it.description,
          valueType: it.valueType,
        })),
      );
      toast.success(`Updated ${dirty.length} setting${dirty.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const onReset = async (key: string) => {
    try {
      await reset.mutateAsync(key);
      toast.success("Reset to default");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const onTogglePublic = async (item: ConfigItem, next: boolean) => {
    try {
      await update.mutateAsync({
        key: item.key,
        value: item.value,
        description: item.description,
        valueType: item.valueType,
        public: next,
      });
      toast.success(next ? "Exposed publicly" : "Made private");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const onDelete = async (item: ConfigItem) => {
    if (!window.confirm(`Delete "${item.key}"? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(item.key);
      toast.success(`Deleted ${item.key}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const rowBusy = update.isPending || del.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={save} disabled={!dirty.length || bulk.isPending} className="gap-1">
          <Save className="h-4 w-4" /> Save {dirty.length || ""}
        </Button>
      </div>

      <CreateKeyCard existingKeys={items.map((i) => i.key)} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-2xl p-6 text-sm text-muted-foreground">
          No configuration items yet. Create your first key above.
        </Card>
      ) : (
        Object.entries(grouped).map(([category, group]) => (
          <Card key={category} className="rounded-2xl p-5 shadow-card">
            <h3 className="font-display text-lg font-extrabold">{category}</h3>
            <div className="mt-4 divide-y divide-border">
              {group.map((it) => (
                <ConfigRow
                  key={it.key}
                  item={it}
                  value={draft[it.key]}
                  busy={rowBusy}
                  onChange={(v) => setDraft((d) => ({ ...d, [it.key]: v }))}
                  onReset={() => onReset(it.key)}
                  onTogglePublic={(next) => onTogglePublic(it, next)}
                  onDelete={() => onDelete(it)}
                />
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

const ConfigRow = ({
  item,
  value,
  busy,
  onChange,
  onReset,
  onTogglePublic,
  onDelete,
}: {
  item: ConfigItem;
  value: unknown;
  busy?: boolean;
  onChange: (v: unknown) => void;
  onReset: () => void;
  onTogglePublic: (next: boolean) => void;
  onDelete: () => void;
}) => {
  const type = item.valueType;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{item.key}</p>
          {type && (
            <Badge variant="outline" className="text-[10px] uppercase">
              {type}
            </Badge>
          )}
          {item.protected && (
            <Badge variant="secondary" className="text-[10px]">
              system
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
        {!item.protected && (
          <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={!!item.public}
              onCheckedChange={onTogglePublic}
              disabled={busy}
            />
            Public (exposed via /system-config)
          </label>
        )}
      </div>

      <div className="flex w-full max-w-sm items-center gap-2">
        {item.protected ? (
          <p className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono text-xs text-muted-foreground">
            {typeof value === "string" ? value : JSON.stringify(value)}
          </p>
        ) : type === "boolean" ? (
          <Switch checked={!!value} onCheckedChange={onChange} />
        ) : type === "json" || type === "array" ? (
          <Textarea
            value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            rows={3}
            className="font-mono text-xs"
          />
        ) : (
          <Input
            type={type === "number" ? "number" : "text"}
            value={value == null ? "" : String(value)}
            onChange={(e) =>
              onChange(type === "number" ? Number(e.target.value) : e.target.value)
            }
          />
        )}

        {!item.protected && (
          <>
            <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset to default">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={busy}
              aria-label="Delete key"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- create key */

const CreateKeyCard = ({ existingKeys }: { existingKeys: string[] }) => {
  const create = useCreateConfigKey();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [category, setCategory] = useState<string>(CONFIG_CATEGORIES[0]);
  const [valueType, setValueType] = useState<ConfigType>("string");
  const [isPublic, setIsPublic] = useState(false);
  const [description, setDescription] = useState("");
  const [rawValue, setRawValue] = useState("");

  const reset = () => {
    setKey("");
    setCategory(CONFIG_CATEGORIES[0]);
    setValueType("string");
    setIsPublic(false);
    setDescription("");
    setRawValue("");
  };

  const submit = async () => {
    const trimmed = key.trim();
    if (!trimmed) {
      toast.error("Key is required");
      return;
    }
    if (existingKeys.includes(trimmed)) {
      toast.error(`"${trimmed}" already exists`);
      return;
    }
    let value: unknown;
    try {
      value = parseValueForType(rawValue, valueType);
    } catch {
      toast.error(`Value is not valid ${valueType.toUpperCase()}`);
      return;
    }
    try {
      await create.mutateAsync({
        key: trimmed,
        value,
        category,
        description: description.trim() || undefined,
        valueType,
        public: isPublic,
      });
      toast.success(`Created ${trimmed}`);
      reset();
      setOpen(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-1">
        <Plus className="h-4 w-4" /> New config key
      </Button>
    );
  }

  return (
    <Card className="rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-extrabold">New config key</h3>
        <Button variant="ghost" size="sm" onClick={() => { reset(); setOpen(false); }}>
          Cancel
        </Button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cfg-key">Key</Label>
          <Input
            id="cfg-key"
            placeholder="DELIVERY_BASE_FEE"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONFIG_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Value type</Label>
          <Select
            value={valueType}
            onValueChange={(v) => setValueType(v as ConfigType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONFIG_VALUE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            Public
          </label>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cfg-desc">Description</Label>
          <Input
            id="cfg-desc"
            placeholder="What this controls"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Value</Label>
          {valueType === "boolean" ? (
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={rawValue === "true"}
                onCheckedChange={(c) => setRawValue(c ? "true" : "false")}
              />
              {rawValue === "true" ? "true" : "false"}
            </label>
          ) : valueType === "json" || valueType === "array" ? (
            <Textarea
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              rows={3}
              placeholder={valueType === "array" ? '["a","b"]' : '{ "key": "value" }'}
              className="font-mono text-xs"
            />
          ) : (
            <Input
              type={valueType === "number" ? "number" : "text"}
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
            />
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={submit} disabled={create.isPending} className="gap-1">
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create key
        </Button>
      </div>
    </Card>
  );
};

/* ----------------------------------------------------------- permissions tab */

const PermissionsTab = ({ enabled }: { enabled: boolean }) => {
  const { data: catalog, isLoading: catalogLoading } = usePermissionCatalog(enabled);
  const { data: matrix, isLoading: matrixLoading } = usePermissionMatrix(enabled);
  const update = useUpdatePermissionMatrix();
  const resetMatrix = useResetPermissionMatrix();
  const [draft, setDraft] = useState<PermissionMatrix | null>(null);

  useEffect(() => {
    if (matrix) setDraft(JSON.parse(JSON.stringify(matrix)));
  }, [matrix]);

  const wildcard = catalog?.wildcard ?? "*";

  const dirty = useMemo(
    () => !!draft && !!matrix && JSON.stringify(draft) !== JSON.stringify(matrix),
    [draft, matrix],
  );

  const has = (role: string, token: string) => {
    const perms = draft?.[role] ?? [];
    return perms.includes(wildcard) || perms.includes(token);
  };

  const toggle = (role: string, token: string, checked: boolean) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const set = new Set(prev[role] ?? []);
      if (checked) set.add(token);
      else set.delete(token);
      return { ...prev, [role]: Array.from(set) };
    });
  };

  const save = async () => {
    if (!draft) return;
    // This matrix governs BUILT-IN roles only. Custom operational roles are
    // authoritative on their own Role document (managed under Roles) and the
    // effective matrix folds them in for display; the server rejects them here.
    // Submit built-ins only so the presence of a custom role can never break the
    // save with an "Unknown role" error.
    const builtins = catalog?.roles ?? [];
    const payload: PermissionMatrix = {};
    for (const role of builtins) {
      if (draft[role]) payload[role] = draft[role];
    }
    try {
      await update.mutateAsync(payload);
      toast.success("Permission matrix saved — roles update immediately");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const onReset = async () => {
    if (!window.confirm("Reset every role to its built-in default permissions?")) return;
    try {
      const next = await resetMatrix.mutateAsync();
      setDraft(JSON.parse(JSON.stringify(next)));
      toast.success("Reset to defaults");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  if (catalogLoading || matrixLoading || !catalog || !draft) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tokens = catalog.tokens.filter((t) => t !== wildcard);
  const roles = catalog.roles;
  const label = (token: string) => catalog.permissions[token] ?? token;
  // Custom operational roles are not part of the editable built-in matrix, but
  // the effective matrix folds them in. Surface them read-only so a super admin
  // sees the full picture in one place; editing happens under Roles.
  const customRoleKeys = Object.keys(draft)
    .filter((r) => !roles.includes(r) && r !== wildcard)
    .sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Grant capability tokens per role. Super admin always keeps full access.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset} disabled={resetMatrix.isPending} className="gap-1">
            <RotateCcw className="h-4 w-4" /> Reset defaults
          </Button>
          <Button onClick={save} disabled={!dirty || update.isPending} className="gap-1">
            {update.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save matrix
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto rounded-2xl p-0 shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-background px-4 py-3 text-left font-semibold">
                Capability
              </th>
              {roles.map((role) => (
                <th key={role} className="px-3 py-3 text-center font-semibold">
                  <span className="whitespace-nowrap">{role}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token} className="border-b border-border/60 last:border-0">
                <td className="sticky left-0 z-10 bg-background px-4 py-2.5">
                  <div className="font-medium">{label(token)}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{token}</div>
                </td>
                {roles.map((role) => {
                  const full = (draft[role] ?? []).includes(wildcard);
                  return (
                    <td key={role} className="px-3 py-2.5 text-center">
                      {full ? (
                        <ShieldCheck
                          className="mx-auto h-4 w-4 text-primary"
                          aria-label="Full access"
                        />
                      ) : (
                        <Checkbox
                          checked={has(role, token)}
                          onCheckedChange={(c) => toggle(role, token, c === true)}
                          aria-label={`${role} — ${token}`}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {customRoleKeys.length > 0 && (
        <Card className="overflow-x-auto rounded-2xl p-0 shadow-card">
          <div className="border-b border-border px-4 py-3">
            <p className="font-semibold">Custom roles</p>
            <p className="text-xs text-muted-foreground">
              Read-only here — manage these under Roles. Shown so you can see the full effective
              matrix in one place.
            </p>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 z-10 bg-background px-4 py-3 text-left font-semibold">
                  Capability
                </th>
                {customRoleKeys.map((role) => (
                  <th key={role} className="px-3 py-3 text-center font-semibold">
                    <span className="whitespace-nowrap font-mono text-xs">{role}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token} className="border-b border-border/60 last:border-0">
                  <td className="sticky left-0 z-10 bg-background px-4 py-2.5">
                    <div className="font-medium">{label(token)}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{token}</div>
                  </td>
                  {customRoleKeys.map((role) => {
                    const granted = (draft[role] ?? []).includes(token);
                    return (
                      <td key={role} className="px-3 py-2.5 text-center">
                        {granted ? (
                          <Check className="mx-auto h-4 w-4 text-primary" aria-label="Granted" />
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default AdminConfig;
