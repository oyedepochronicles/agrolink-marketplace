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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  useActiveFeeSchedule,
  useArchiveFeeSchedule,
  useCreateFeeDraft,
  useFeeSchedules,
  usePublishFeeSchedule,
  useUpdateFeeDraft,
  type FeeRate,
  type FeeRateInput,
  type FeeSchedule,
  type FeeScheduleInput,
  type FeeStatus,
  type RateType,
} from "@/hooks/useFeesAdmin";
import { apiErrorMessage } from "@/lib/api";
import { isSuperAdmin } from "@/lib/authz";
import { formatDate, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal, Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const RATE_KEYS = ["farmerFee", "agentCommission", "riderFee", "serviceFee", "tax"] as const;
type RateKey = (typeof RATE_KEYS)[number];

const RATE_LABELS: Record<RateKey, string> = {
  farmerFee: "Farmer fee",
  agentCommission: "Agent commission",
  riderFee: "Rider fee",
  serviceFee: "Service fee",
  tax: "Tax",
};

const RATE_HINTS: Record<RateKey, string> = {
  farmerFee: "Platform cut on the order subtotal.",
  agentCommission: "Carved from the platform farmer fee for agent-managed orders (0 otherwise).",
  riderFee: "Computed against the delivery fee.",
  serviceFee: "Applied to the cart subtotal (batch checkout).",
  tax: "Applied to the cart subtotal (batch checkout).",
};

// Form state uses strings so number inputs can be edited/cleared freely; values
// are coerced to numbers (empty min/max => null) only at submit.
type RateForm = { type: RateType; value: string; min: string; max: string };
type DeliveryForm = { baseFee: string; perKmFee: string; expressMultiplier: string };
type FeeForm = {
  rates: Record<RateKey, RateForm>;
  delivery: DeliveryForm;
  notes: string;
};

const emptyRate = (): RateForm => ({ type: "percent", value: "0", min: "", max: "" });

const EMPTY_FEE_FORM: FeeForm = {
  rates: {
    farmerFee: emptyRate(),
    agentCommission: emptyRate(),
    riderFee: emptyRate(),
    serviceFee: emptyRate(),
    tax: emptyRate(),
  },
  delivery: { baseFee: "0", perKmFee: "0", expressMultiplier: "0" },
  notes: "",
};

const num = (v: string) => (v.trim() === "" ? 0 : Number(v));
const nullNum = (v: string) => (v.trim() === "" ? null : Number(v));

const rateToForm = (r?: FeeRate): RateForm => ({
  type: r?.type ?? "percent",
  value: r ? String(r.value) : "0",
  min: r?.min != null ? String(r.min) : "",
  max: r?.max != null ? String(r.max) : "",
});

const scheduleToForm = (s: FeeSchedule): FeeForm => ({
  rates: {
    farmerFee: rateToForm(s.farmerFee),
    agentCommission: rateToForm(s.agentCommission),
    riderFee: rateToForm(s.riderFee),
    serviceFee: rateToForm(s.serviceFee),
    tax: rateToForm(s.tax),
  },
  delivery: {
    baseFee: String(s.delivery?.baseFee ?? 0),
    perKmFee: String(s.delivery?.perKmFee ?? 0),
    expressMultiplier: String(s.delivery?.expressMultiplier ?? 0),
  },
  notes: s.notes ?? "",
});

const rateToInput = (r: RateForm): FeeRateInput => ({
  type: r.type,
  value: num(r.value),
  min: nullNum(r.min),
  max: nullNum(r.max),
});

const formToInput = (f: FeeForm): FeeScheduleInput => ({
  farmerFee: rateToInput(f.rates.farmerFee),
  agentCommission: rateToInput(f.rates.agentCommission),
  riderFee: rateToInput(f.rates.riderFee),
  serviceFee: rateToInput(f.rates.serviceFee),
  tax: rateToInput(f.rates.tax),
  delivery: {
    baseFee: num(f.delivery.baseFee),
    perKmFee: num(f.delivery.perKmFee),
    expressMultiplier: num(f.delivery.expressMultiplier),
  },
  notes: f.notes.trim() || undefined,
});

const describeRate = (r?: FeeRate): string => {
  if (!r) return "—";
  const base = r.type === "percent" ? `${r.value}%` : formatNaira(r.value);
  const clamps: string[] = [];
  if (r.min != null) clamps.push(`min ${formatNaira(r.min)}`);
  if (r.max != null) clamps.push(`max ${formatNaira(r.max)}`);
  return clamps.length ? `${base} · ${clamps.join(" · ")}` : base;
};

const STATUS_BADGE: Record<FeeStatus, string> = {
  active: "border-transparent bg-primary/10 text-primary",
  scheduled: "border-transparent bg-amber-100 text-amber-700",
  draft: "border-transparent bg-secondary text-muted-foreground",
  archived: "border-transparent bg-muted text-muted-foreground",
  fallback: "border-transparent bg-muted text-muted-foreground",
};

const RateEditor = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: RateForm;
  onChange: (next: RateForm) => void;
}) => (
  <div className="space-y-2 rounded-xl border border-border p-3">
    <div>
      <Label className="text-sm">{label}</Label>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Type</Label>
        <Select value={value.type} onValueChange={(v) => onChange({ ...value, type: v as RateType })}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">Percent</SelectItem>
            <SelectItem value="flat">Flat (₦)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">
          {value.type === "percent" ? "Value (%)" : "Value (₦)"}
        </Label>
        <Input
          type="number"
          min={0}
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Min ₦</Label>
        <Input
          type="number"
          min={0}
          placeholder="—"
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Max ₦</Label>
        <Input
          type="number"
          min={0}
          placeholder="—"
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
        />
      </div>
    </div>
  </div>
);

const FeeManager = () => {
  const { user } = useAuth();
  const canWrite = isSuperAdmin(user);

  const { data: schedules, isLoading, error } = useFeeSchedules();
  const { data: active } = useActiveFeeSchedule();

  const createDraft = useCreateFeeDraft();
  const updateDraft = useUpdateFeeDraft();
  const publish = usePublishFeeSchedule();
  const archiveSchedule = useArchiveFeeSchedule();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FeeForm>(EMPTY_FEE_FORM);

  const [publishTarget, setPublishTarget] = useState<FeeSchedule | null>(null);
  const [publishDate, setPublishDate] = useState("");

  const openCreate = () => {
    setEditorMode("create");
    setEditingId(null);
    setForm(EMPTY_FEE_FORM);
    setEditorOpen(true);
  };

  const openEdit = (s: FeeSchedule) => {
    if (!s._id) return;
    setEditorMode("edit");
    setEditingId(s._id);
    setForm(scheduleToForm(s));
    setEditorOpen(true);
  };

  const openPublish = (s: FeeSchedule) => {
    setPublishTarget(s);
    setPublishDate("");
  };

  const submitEditor = async () => {
    const numeric = RATE_KEYS.flatMap((k) => [
      form.rates[k].value,
      form.rates[k].min,
      form.rates[k].max,
    ]).concat([form.delivery.baseFee, form.delivery.perKmFee, form.delivery.expressMultiplier]);
    if (numeric.some((v) => v.trim() !== "" && !Number.isFinite(Number(v)))) {
      toast.error("Enter valid numbers for all rate fields");
      return;
    }
    const input = formToInput(form);
    try {
      if (editorMode === "create") {
        await createDraft.mutateAsync(input);
        toast.success("Draft schedule created");
      } else if (editingId) {
        await updateDraft.mutateAsync({ id: editingId, ...input });
        toast.success("Draft schedule updated");
      }
      setEditorOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const submitPublish = async () => {
    if (!publishTarget?._id) return;
    try {
      const effectiveFrom = publishDate ? new Date(publishDate).toISOString() : undefined;
      await publish.mutateAsync({ id: publishTarget._id, effectiveFrom });
      toast.success(`Fee schedule v${publishTarget.version} published`);
      setPublishTarget(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const archive = async (s: FeeSchedule) => {
    if (!s._id) return;
    if (
      !window.confirm(
        `Archive fee schedule v${s.version}? It stops applying to new orders. Historical orders keep the exact snapshot they were priced with.`,
      )
    )
      return;
    try {
      await archiveSchedule.mutateAsync(s._id);
      toast.success(`Fee schedule v${s.version} archived`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const columns: ColumnDef<FeeSchedule, unknown>[] = [
    {
      accessorKey: "version",
      header: "Version",
      cell: ({ row }) => <span className="font-medium tabular-nums">v{row.original.version}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("rounded-full capitalize", STATUS_BADGE[row.original.status])}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "farmerFee",
      header: "Farmer",
      cell: ({ row }) => <span className="text-xs">{describeRate(row.original.farmerFee)}</span>,
    },
    {
      id: "agentCommission",
      header: "Agent",
      cell: ({ row }) => <span className="text-xs">{describeRate(row.original.agentCommission)}</span>,
    },
    {
      id: "riderFee",
      header: "Rider",
      cell: ({ row }) => <span className="text-xs">{describeRate(row.original.riderFee)}</span>,
    },
    {
      accessorKey: "effectiveFrom",
      header: "Effective",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.effectiveFrom ? formatDate(row.original.effectiveFrom) : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const s = row.original;
        const id = s._id;
        if (!canWrite || !id) return null;
        const canArchive = s.status === "active" || s.status === "scheduled";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Schedule actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {s.status === "draft" && (
                <>
                  <DropdownMenuItem onClick={() => openEdit(s)}>Edit draft</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openPublish(s)}>Publish…</DropdownMenuItem>
                </>
              )}
              {canArchive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => archive(s)}>
                    Archive
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
        title="Fees & commissions"
        description="Versioned fee schedules. Publishing a new version never rewrites historical orders — each order keeps the exact version it was priced with. Only a super admin can create or publish schedules."
        action={
          canWrite ? (
            <Button className="rounded-full" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New draft
            </Button>
          ) : undefined
        }
      />

      {active ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold">Currently in force</h3>
              <Badge variant="outline" className={cn("rounded-full capitalize", STATUS_BADGE[active.status])}>
                {active.isFallback ? "Baseline" : active.status}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {active.isFallback ? "Configured default" : `Version ${active.version}`}
              {active.effectiveFrom ? ` · Effective ${formatDate(active.effectiveFrom)}` : ""}
            </span>
          </div>
          {active.isFallback && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              No schedule has been published — the platform is using the configured baseline (Platform
              config / environment). Publish a schedule to take explicit, versioned control of fees.
            </p>
          )}
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RATE_KEYS.map((k) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{RATE_LABELS[k]}</dt>
                <dd className="text-sm font-medium">{describeRate(active[k])}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Delivery</dt>
              <dd className="text-sm font-medium">
                {formatNaira(active.delivery?.baseFee ?? 0)} + {formatNaira(active.delivery?.perKmFee ?? 0)}
                /km · express ×{active.delivery?.expressMultiplier ?? 0}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{apiErrorMessage(error)}</p>
      ) : (
        <DataTable
          data={schedules ?? []}
          columns={columns}
          searchPlaceholder="Search by status"
          searchableKeys={["status", "notes"]}
          emptyMessage="No fee schedules yet. Create a draft to get started."
        />
      )}

      {/* Create / edit draft dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editorMode === "create" ? "New fee schedule (draft)" : "Edit draft schedule"}</DialogTitle>
            <DialogDescription>
              Set each component as a percentage or a flat Naira amount, with optional min/max clamps.
              A new version is created as a draft; it only takes effect once published.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {RATE_KEYS.map((k) => (
              <RateEditor
                key={k}
                label={RATE_LABELS[k]}
                hint={RATE_HINTS[k]}
                value={form.rates[k]}
                onChange={(next) => setForm((f) => ({ ...f, rates: { ...f.rates, [k]: next } }))}
              />
            ))}

            <div className="space-y-2 rounded-xl border border-border p-3">
              <Label className="text-sm">Delivery (single-order)</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Base fee ₦</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.delivery.baseFee}
                    onChange={(e) => setForm((f) => ({ ...f, delivery: { ...f.delivery, baseFee: e.target.value } }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Per-km fee ₦</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.delivery.perKmFee}
                    onChange={(e) => setForm((f) => ({ ...f, delivery: { ...f.delivery, perKmFee: e.target.value } }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Express multiplier</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.delivery.expressMultiplier}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, delivery: { ...f.delivery, expressMultiplier: e.target.value } }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fee-notes">Notes</Label>
              <Textarea
                id="fee-notes"
                rows={2}
                placeholder="Optional internal note about this version"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full"
              onClick={submitEditor}
              disabled={createDraft.isPending || updateDraft.isPending}
            >
              {(createDraft.isPending || updateDraft.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editorMode === "create" ? "Create draft" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish dialog */}
      <Dialog open={!!publishTarget} onOpenChange={(o) => !o && setPublishTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish schedule v{publishTarget?.version}</DialogTitle>
            <DialogDescription>
              Publishing makes this the active fee schedule and supersedes the current one for all new
              orders. Existing orders are unaffected. Leave the date empty to take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="fee-effective">Effective from (optional)</Label>
            <Input
              id="fee-effective"
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              A future date schedules the version; it becomes active automatically at that time.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setPublishTarget(null)}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={submitPublish} disabled={publish.isPending}>
              {publish.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeManager;
