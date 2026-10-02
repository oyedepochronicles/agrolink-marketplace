import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useAssignRecoveryAppeal,
  useRecoveryAppeals,
  useReviewRecoveryAppeal,
  type RecoveryAppeal,
  type RecoveryAppealStatus,
} from "@/hooks/useSecurity";
import { useSecureAsset } from "@/hooks/useSecureAsset";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  FileText,
  Loader2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_META: Record<
  RecoveryAppealStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-warning/15 text-warning-foreground" },
  under_review: { label: "Under review", className: "bg-primary/10 text-primary" },
  additional_info_required: {
    label: "Info required",
    className: "bg-warning/15 text-warning-foreground",
  },
  approved: { label: "Approved", className: "bg-primary text-primary-foreground" },
  rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All appeals" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "additional_info_required", label: "Additional info required" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const StatusBadge = ({ status }: { status: RecoveryAppealStatus }) => {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border-transparent", meta.className)}
    >
      {meta.label}
    </Badge>
  );
};

/** Renders a private identity document through the authenticated secure blob. */
const SecureDocument = ({ url }: { url: string }) => {
  const asset = useSecureAsset(url);
  const src = asset.objectUrl ?? asset.publicUrl;

  if (asset.loading)
    return <Skeleton className="h-40 w-full rounded-xl" />;
  if (asset.error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{asset.error}</AlertDescription>
      </Alert>
    );
  if (!src) return null;

  const isImage = (asset.contentType ?? "").startsWith("image/");
  return (
    <div className="space-y-2">
      {isImage ? (
        <img
          src={src}
          alt="Submitted identity document"
          className="max-h-72 w-full rounded-xl border bg-white object-contain"
        />
      ) : (
        <div className="rounded-xl border bg-muted p-4 text-sm text-muted-foreground">
          This document is not an image preview.
        </div>
      )}
      <Button asChild variant="outline" size="sm" className="rounded-full">
        <a href={src} target="_blank" rel="noopener noreferrer">
          <FileText className="mr-2 h-4 w-4" />
          Open document in new tab
        </a>
      </Button>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-0.5">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <div className="text-sm text-foreground">{children}</div>
  </div>
);

const AdminRecoveryAppeals = () => {
  const [filter, setFilter] = useState<string>("all");
  const { data, isLoading, error } = useRecoveryAppeals(
    filter === "all" ? "" : (filter as RecoveryAppealStatus),
  );
  const assign = useAssignRecoveryAppeal();
  const review = useReviewRecoveryAppeal();

  const [selected, setSelected] = useState<RecoveryAppeal | null>(null);
  const [note, setNote] = useState("");

  const closeDetail = () => {
    setSelected(null);
    setNote("");
  };

  const decided = (s?: RecoveryAppealStatus) =>
    s === "approved" || s === "rejected" || s === "cancelled";

  const onAssign = async (appeal: RecoveryAppeal) => {
    try {
      const res = await assign.mutateAsync({ id: appeal.id, note: note || undefined });
      toast.success("Appeal assigned to you");
      setSelected(res.appeal);
      setNote("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const onReview = async (
    appeal: RecoveryAppeal,
    decision: "approved" | "rejected" | "additional_info_required",
  ) => {
    try {
      const res = await review.mutateAsync({
        id: appeal.id,
        decision,
        note: note || undefined,
      });
      toast.success(
        decision === "approved"
          ? "Appeal approved — the account's authenticator has been reset."
          : decision === "rejected"
            ? "Appeal rejected"
            : "Requested additional information",
      );
      setSelected(res.appeal);
      setNote("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const busy = assign.isPending || review.isPending;
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account recovery appeals"
        description="Review appeals from users who lost access to their authenticator. Approving an appeal resets the account's MFA and signs out all existing sessions."
      />

      <div className="flex items-center gap-3">
        <Label htmlFor="appeal-filter" className="text-sm text-muted-foreground">
          Filter
        </Label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger id="appeal-filter" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {apiErrorMessage(error)}
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          No recovery appeals{filter === "all" ? "" : " with this status"}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => {
                const assignedName =
                  a.assignedTo && typeof a.assignedTo === "object"
                    ? a.assignedTo.name || a.assignedTo.email
                    : undefined;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.caseId}</TableCell>
                    <TableCell className="text-sm">{a.maskedAccount}</TableCell>
                    <TableCell className="text-sm">{a.fullName ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {assignedName ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.createdAt
                        ? new Date(a.createdAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setSelected(a);
                          setNote("");
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeDetail()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm">{selected.caseId}</span>
                  <StatusBadge status={selected.status} />
                </DialogTitle>
                <DialogDescription>
                  Account {selected.maskedAccount}
                  {selected.hasAccount === false &&
                    " — no matching account was found"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Full name">{selected.fullName ?? "—"}</Field>
                <Field label="Channel">{selected.contactMethod ?? "—"}</Field>
              </div>
              <Field label="Reason">{selected.reason ?? "—"}</Field>
              {selected.explanation && (
                <Field label="Additional details">{selected.explanation}</Field>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Identity document
                </p>
                {selected.secureDocumentUrl ? (
                  <SecureDocument url={selected.secureDocumentUrl} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No document was provided.
                  </p>
                )}
              </div>

              {Array.isArray(selected.history) && selected.history.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    History
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {selected.history.map((h, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>
                          <span className="font-medium text-foreground">
                            {h.action ?? "update"}
                          </span>
                          {h.note ? ` — ${h.note}` : ""}
                        </span>
                        <span className="shrink-0">
                          {h.at ? new Date(h.at).toLocaleString() : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!decided(selected.status) && (
                <div className="space-y-3 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="review-note">
                      Review note{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="review-note"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Recorded on the appeal's audit trail."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={busy}
                      onClick={() => onAssign(selected)}
                    >
                      {assign.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Assign to me
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={busy}
                      onClick={() => onReview(selected, "approved")}
                    >
                      {review.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Approve &amp; reset MFA
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={busy}
                      onClick={() => onReview(selected, "additional_info_required")}
                    >
                      Request more info
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-full"
                      disabled={busy}
                      onClick={() => onReview(selected, "rejected")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRecoveryAppeals;
