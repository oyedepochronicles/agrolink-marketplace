import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminConfigItems,
  useBulkUpdateConfig,
  useResetConfigKey,
} from "@/hooks/useSystemConfigAdmin";
import { apiErrorMessage } from "@/lib/api";
import type { ConfigItem } from "@/types/config";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const AdminConfig = () => {
  const { data: items = [], isLoading } = useAdminConfigItems();
  const bulk = useBulkUpdateConfig();
  const reset = useResetConfigKey();
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const seed: Record<string, unknown> = {};
    for (const it of items) seed[it.key] = it.value;
    setDraft(seed);
  }, [items]);

  const grouped = useMemo(() => {
    const map: Record<string, ConfigItem[]> = {};
    for (const it of items) {
      (map[it.category] ||= []).push(it);
    }
    return map;
  }, [items]);

  const dirty = useMemo(
    () => items.filter((it) => draft[it.key] !== it.value),
    [items, draft],
  );

  const save = async () => {
    if (!dirty.length) return;
    try {
      await bulk.mutateAsync(dirty.map((it) => ({ key: it.key, value: draft[it.key] })));
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="System configuration"
        description="Tune platform-wide rules. Changes apply to every user once saved."
        action={
          <Button onClick={save} disabled={!dirty.length || bulk.isPending} className="gap-1">
            <Save className="h-4 w-4" /> Save {dirty.length || ""}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-2xl p-6 text-sm text-muted-foreground">
          No configuration items returned by the backend yet.
        </Card>
      ) : (
        Object.entries(grouped).map(([category, group]) => (
          <Card key={category} className="rounded-2xl p-5 shadow-card">
            <h3 className="font-display text-lg font-extrabold capitalize">{category}</h3>
            <div className="mt-4 divide-y divide-border">
              {group.map((it) => (
                <ConfigRow
                  key={it.key}
                  item={it}
                  value={draft[it.key]}
                  onChange={(v) => setDraft((d) => ({ ...d, [it.key]: v }))}
                  onReset={() => onReset(it.key)}
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
  onChange,
  onReset,
}: {
  item: ConfigItem;
  value: unknown;
  onChange: (v: unknown) => void;
  onReset: () => void;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-3 py-3">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold">{item.key}</p>
      {item.description && (
        <p className="text-xs text-muted-foreground">{item.description}</p>
      )}
    </div>
    <div className="flex w-full max-w-sm items-center gap-2">
      {item.type === "boolean" ? (
        <Switch checked={!!value} onCheckedChange={onChange} />
      ) : item.type === "json" || item.type === "array" ? (
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
          type={item.type === "number" ? "number" : "text"}
          value={value == null ? "" : String(value)}
          onChange={(e) =>
            onChange(item.type === "number" ? Number(e.target.value) : e.target.value)
          }
        />
      )}
      <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default AdminConfig;
