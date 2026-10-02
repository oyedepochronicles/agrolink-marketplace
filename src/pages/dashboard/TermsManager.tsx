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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  useArchiveTerms,
  useCreateTermsDraft,
  usePublishTerms,
  useTermsList,
  useUpdateTermsDraft,
  type TermsAudience,
  type TermsDoc,
  type TermsStatus,
} from "@/hooks/useTermsAdmin";
import { apiErrorMessage } from "@/lib/api";
import { isSuperAdmin } from "@/lib/authz";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal, Plus, ScrollText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AUDIENCE_OPTIONS: { value: TermsAudience; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "buyer", label: "Buyers" },
  { value: "farmer", label: "Farmers" },
  { value: "rider", label: "Riders" },
  { value: "agent", label: "Farm agents" },
];

const AUDIENCE_LABELS: Record<TermsAudience, string> = {
  all: "Everyone",
  buyer: "Buyers",
  farmer: "Farmers",
  rider: "Riders",
  agent: "Farm agents",
};

const STATUS_BADGE: Record<TermsStatus, string> = {
  active: "border-transparent bg-primary/10 text-primary",
  scheduled: "border-transparent bg-amber-100 text-amber-700",
  draft: "border-transparent bg-secondary text-muted-foreground",
  archived: "border-transparent bg-muted text-muted-foreground",
};

type TermsFormState = {
  documentKey: string;
  audience: TermsAudience;
  title: string;
  summary: string;
  content: string;
  requiresAcceptance: boolean;
};

const EMPTY_TERMS_FORM: TermsFormState = {
  documentKey: "general",
  audience: "all",
  title: "",
  summary: "",
  content: "",
  requiresAcceptance: true,
};

const TermsManager = () => {
  const { user } = useAuth();
  const canWrite = isSuperAdmin(user);

  const { data: docs, isLoading, error } = useTermsList({});

  const createDraft = useCreateTermsDraft();
  const updateDraft = useUpdateTermsDraft();
  const publish = usePublishTerms();
  const archiveDoc = useArchiveTerms();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TermsFormState>(EMPTY_TERMS_FORM);

  const [viewDoc, setViewDoc] = useState<TermsDoc | null>(null);
  const [publishTarget, setPublishTarget] = useState<TermsDoc | null>(null);
  const [publishDate, setPublishDate] = useState("");

  const openCreate = () => {
    setEditorMode("create");
    setEditingId(null);
    setForm(EMPTY_TERMS_FORM);
    setEditorOpen(true);
  };

  const openEdit = (d: TermsDoc) => {
    setEditorMode("edit");
    setEditingId(d._id);
    setForm({
      documentKey: d.documentKey,
      audience: d.audience,
      title: d.title,
      summary: d.summary ?? "",
      content: d.content,
      requiresAcceptance: d.requiresAcceptance,
    });
    setEditorOpen(true);
  };

  const openPublish = (d: TermsDoc) => {
    setPublishTarget(d);
    setPublishDate("");
  };

  const submitEditor = async () => {
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) {
      toast.error("Title is required");
      return;
    }
    if (!content) {
      toast.error("Content is required");
      return;
    }
    try {
      if (editorMode === "create") {
        await createDraft.mutateAsync({
          documentKey: form.documentKey.trim() || undefined,
          audience: form.audience,
          title,
          summary: form.summary.trim() || undefined,
          content,
          requiresAcceptance: form.requiresAcceptance,
        });
        toast.success("Draft terms created");
      } else if (editingId) {
        // documentKey / audience / version are immutable — a change is a new document.
        await updateDraft.mutateAsync({
          id: editingId,
          title,
          summary: form.summary.trim() || undefined,
          content,
          requiresAcceptance: form.requiresAcceptance,
        });
        toast.success("Draft terms updated");
      }
      setEditorOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const submitPublish = async () => {
    if (!publishTarget) return;
    try {
      const effectiveFrom = publishDate ? new Date(publishDate).toISOString() : undefined;
      await publish.mutateAsync({ id: publishTarget._id, effectiveFrom });
      toast.success(`"${publishTarget.title}" v${publishTarget.version} published`);
      setPublishTarget(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const archive = async (d: TermsDoc) => {
    if (
      !window.confirm(
        `Archive "${d.title}" v${d.version}? It stops being served to users. Recorded acceptances are retained against their exact version.`,
      )
    )
      return;
    try {
      await archiveDoc.mutateAsync(d._id);
      toast.success(`"${d.title}" v${d.version} archived`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const columns: ColumnDef<TermsDoc, unknown>[] = [
    {
      accessorKey: "title",
      header: "Document",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.title}</span>
            <Badge variant="outline" className="rounded-full text-[10px]">
              {AUDIENCE_LABELS[row.original.audience]}
            </Badge>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">{row.original.documentKey}</span>
        </div>
      ),
    },
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
      id: "requiresAcceptance",
      header: "Acceptance",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.requiresAcceptance ? "Required" : "Informational"}
        </span>
      ),
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
        const d = row.original;
        const canArchive = d.status === "active" || d.status === "scheduled";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Document actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewDoc(d)}>View text</DropdownMenuItem>
              {canWrite && d.status === "draft" && (
                <>
                  <DropdownMenuItem onClick={() => openEdit(d)}>Edit draft</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openPublish(d)}>Publish…</DropdownMenuItem>
                </>
              )}
              {canWrite && canArchive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => archive(d)}>
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
        title="Terms & conditions"
        description="Versioned legal documents per audience. Publishing supersedes the prior active version and notifies the audience — published text is never overwritten, and each acceptance is recorded against its exact version. Only a super admin can create or publish."
        action={
          canWrite ? (
            <Button className="rounded-full" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New draft
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{apiErrorMessage(error)}</p>
      ) : (
        <DataTable
          data={docs ?? []}
          columns={columns}
          searchPlaceholder="Search by title or key"
          searchableKeys={["title", "documentKey"]}
          emptyMessage="No terms documents yet. Create a draft to get started."
        />
      )}

      {/* Create / edit draft dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editorMode === "create" ? "New terms document (draft)" : "Edit draft document"}</DialogTitle>
            <DialogDescription>
              {editorMode === "create"
                ? "Create a draft. The audience and key are fixed once created — a later change becomes a new version. The draft only takes effect when published."
                : "Editing a draft. The audience and key are immutable; publish to make this the active version."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="terms-key">Document key</Label>
                <Input
                  id="terms-key"
                  placeholder="general"
                  value={form.documentKey}
                  disabled={editorMode === "edit"}
                  onChange={(e) => setForm((f) => ({ ...f, documentKey: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">
                  Lowercase slug, e.g. <span className="font-mono">privacy</span> or{" "}
                  <span className="font-mono">seller-agreement</span>.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select
                  value={form.audience}
                  disabled={editorMode === "edit"}
                  onValueChange={(v) => setForm((f) => ({ ...f, audience: v as TermsAudience }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="terms-title">Title</Label>
              <Input
                id="terms-title"
                placeholder="Seller Agreement"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="terms-summary">Summary</Label>
              <Input
                id="terms-summary"
                placeholder="Short line shown in the acceptance prompt (optional)"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="terms-content">Content</Label>
              <Textarea
                id="terms-content"
                rows={12}
                placeholder="Full legal text. Line breaks are preserved."
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <Label htmlFor="terms-accept">Requires acceptance</Label>
                <p className="text-[11px] text-muted-foreground">
                  When on, the audience must accept this version before continuing to use the app.
                </p>
              </div>
              <Switch
                id="terms-accept"
                checked={form.requiresAcceptance}
                onCheckedChange={(v) => setForm((f) => ({ ...f, requiresAcceptance: v }))}
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

      {/* View text dialog */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 shrink-0 text-primary" />
              {viewDoc?.title}
            </DialogTitle>
            <DialogDescription>
              {viewDoc ? `${AUDIENCE_LABELS[viewDoc.audience]} · ${viewDoc.documentKey} · Version ${viewDoc.version}` : ""}
              {viewDoc?.effectiveFrom ? ` · Effective ${formatDate(viewDoc.effectiveFrom)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-secondary/30 p-4 text-sm leading-relaxed">
            {viewDoc?.content}
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish dialog */}
      <Dialog open={!!publishTarget} onOpenChange={(o) => !o && setPublishTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish "{publishTarget?.title}" v{publishTarget?.version}</DialogTitle>
            <DialogDescription>
              Publishing supersedes the current active version for{" "}
              {publishTarget ? AUDIENCE_LABELS[publishTarget.audience].toLowerCase() : "the audience"} and, when
              acceptance is required, prompts them to re-accept. The prior version is preserved. Leave the date
              empty to take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="terms-effective">Effective from (optional)</Label>
            <Input
              id="terms-effective"
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

export default TermsManager;
