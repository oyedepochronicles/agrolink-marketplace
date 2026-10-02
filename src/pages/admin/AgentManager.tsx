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
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdminAgentActivity,
  useAdminAgentDetail,
  useAdminAgents,
  useAgentDecision,
  useAssignAgentToFarmer,
  useRevokeAgentAssignment,
  type AgentDecision,
} from "@/hooks/useAdminAgents";
import { apiErrorMessage } from "@/lib/api";
import { hasPermission } from "@/lib/authz";
import { formatDate } from "@/lib/format";
import {
  refId,
  refLabel,
  refUser,
  type AgentActivityItem,
  type AgentProfile,
} from "@/types/agents";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "rounded-full border-transparent bg-primary/10 text-primary",
  pending: "rounded-full border-transparent bg-amber-500/10 text-amber-600",
  suspended: "rounded-full border-transparent bg-destructive/10 text-destructive",
  rejected: "rounded-full border-transparent bg-muted text-muted-foreground",
};

const STATUS_FILTERS = ["all", "pending", "active", "suspended", "rejected"] as const;

const AgentManager = () => {
  const { user } = useAuth();
  const canApprove = hasPermission(user, "agents:approve");
  const canAssign = hasPermission(user, "agents:assign");

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: agents, isLoading, error } = useAdminAgents(
    statusFilter === "all" ? undefined : statusFilter,
  );

  const decision = useAgentDecision();
  const assign = useAssignAgentToFarmer();

  const [detailId, setDetailId] = useState<string | null>(null);

  // Reason-gated decision dialog (suspend / reject both require a reason).
  const [reasonDialog, setReasonDialog] = useState<{
    id: string;
    decision: Extract<AgentDecision, "suspend" | "reject">;
    name: string;
  } | null>(null);
  const [reason, setReason] = useState("");

  // Assign-to-farmer dialog.
  const [assignDialog, setAssignDialog] = useState<{ agentId: string; name: string } | null>(null);
  const [farmerId, setFarmerId] = useState("");

  const runDecision = async (id: string, d: AgentDecision, reasonText?: string) => {
    try {
      await decision.mutateAsync({ id, decision: d, reason: reasonText });
      toast.success(
        d === "approve" ? "Agent approved" : d === "suspend" ? "Agent suspended" : "Agent rejected",
      );
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const submitReason = async () => {
    if (!reasonDialog) return;
    if (!reason.trim()) return toast.error("A reason is required");
    await runDecision(reasonDialog.id, reasonDialog.decision, reason.trim());
    setReasonDialog(null);
    setReason("");
  };

  const submitAssign = async () => {
    if (!assignDialog) return;
    if (!farmerId.trim()) return toast.error("Enter the farmer's user id");
    try {
      await assign.mutateAsync({ agentId: assignDialog.agentId, farmerId: farmerId.trim() });
      toast.success("Agent assigned to farmer");
      setAssignDialog(null);
      setFarmerId("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const columns: ColumnDef<AgentProfile, unknown>[] = [
    {
      id: "agent",
      header: "Agent",
      cell: ({ row }) => {
        const u = refUser(row.original.userId);
        return (
          <div className="min-w-[180px]">
            <p className="font-medium">{refLabel(row.original.userId)}</p>
            {u?.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={STATUS_STYLES[row.original.status] ?? "rounded-full"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "farmers",
      header: "Active farmers",
      cell: ({ row }) => <span className="text-sm">{row.original.activeFarmerCount ?? 0}</span>,
    },
    {
      id: "applied",
      header: "Applied",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const p = row.original;
        const name = refLabel(p.userId);
        const agentUserId = refId(p.userId);
        const busy = decision.isPending;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Agent actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailId(p._id)}>View details</DropdownMenuItem>

              {canApprove && (p.status === "pending" || p.status === "suspended") && (
                <DropdownMenuItem disabled={busy} onClick={() => runDecision(p._id, "approve")}>
                  {p.status === "suspended" ? "Reactivate" : "Approve"}
                </DropdownMenuItem>
              )}
              {canApprove && p.status === "active" && (
                <DropdownMenuItem
                  disabled={busy}
                  onClick={() => setReasonDialog({ id: p._id, decision: "suspend", name })}
                >
                  Suspend
                </DropdownMenuItem>
              )}
              {canApprove && p.status === "pending" && (
                <DropdownMenuItem
                  disabled={busy}
                  className="text-destructive"
                  onClick={() => setReasonDialog({ id: p._id, decision: "reject", name })}
                >
                  Reject
                </DropdownMenuItem>
              )}

              {canAssign && p.status === "active" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setAssignDialog({ agentId: agentUserId, name })}>
                    Assign to farmer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farm Agents"
        description="Review agent applications, manage their status, and assign agents to farmers. Agents act on behalf of assigned farmers only — every action is enforced and audited server-side."
      />

      <div className="flex items-center gap-3">
        <Label htmlFor="status-filter" className="text-sm text-muted-foreground">
          Status
        </Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {apiErrorMessage(error)}
        </p>
      ) : isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : (
        <DataTable
          data={agents ?? []}
          columns={columns}
          searchPlaceholder="Search by status"
          searchableKeys={["status"]}
          emptyMessage="No agents found."
        />
      )}

      {/* Reason dialog (suspend / reject) */}
      <Dialog open={!!reasonDialog} onOpenChange={(o) => !o && (setReasonDialog(null), setReason(""))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reasonDialog?.decision === "suspend" ? "Suspend" : "Reject"} {reasonDialog?.name}
            </DialogTitle>
            <DialogDescription>
              This is recorded in the audit log. A reason is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why…"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setReasonDialog(null);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full"
              variant={reasonDialog?.decision === "reject" ? "destructive" : "default"}
              onClick={submitReason}
              disabled={decision.isPending}
            >
              {decision.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign-to-farmer dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(o) => !o && (setAssignDialog(null), setFarmerId(""))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign {assignDialog?.name} to a farmer</DialogTitle>
            <DialogDescription>
              Creates an active assignment immediately. The agent will be able to manage that farmer's
              listings and orders on their behalf.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="farmer-id">Farmer user id</Label>
            <Input
              id="farmer-id"
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              placeholder="e.g. 665f1c…"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setAssignDialog(null);
                setFarmerId("");
              }}
            >
              Cancel
            </Button>
            <Button className="rounded-full" onClick={submitAssign} disabled={assign.isPending}>
              {assign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detailId && (
        <AgentDetailDialog id={detailId} canAssign={canAssign} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
};

/** Detail dialog — profile, assigned farmers (revocable), and recent activity. */
const AgentDetailDialog = ({
  id,
  canAssign,
  onClose,
}: {
  id: string;
  canAssign: boolean;
  onClose: () => void;
}) => {
  const { data: detail, isLoading } = useAdminAgentDetail(id, true);
  const { data: activity } = useAdminAgentActivity(id, true);
  const revoke = useRevokeAgentAssignment();

  const onRevoke = async (assignmentId: string) => {
    try {
      await revoke.mutateAsync({ id: assignmentId });
      toast.success("Assignment revoked");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const activeFarmers = (detail?.farmers ?? []).filter((f) => f.status === "active");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {isLoading || !detail ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {refLabel(detail.profile.userId)}
              </DialogTitle>
              <DialogDescription>
                {refUser(detail.profile.userId)?.email} · {detail.profile.status}
              </DialogDescription>
            </DialogHeader>

            {detail.profile.applicationNote && (
              <div className="rounded-xl border bg-secondary/30 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Application note
                </p>
                {detail.profile.applicationNote}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold">Assigned farmers ({activeFarmers.length})</p>
              {activeFarmers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active assignments.</p>
              ) : (
                activeFarmers.map((f) => (
                  <div
                    key={f._id}
                    className="flex items-center justify-between rounded-xl border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{refLabel(f.farmerId)}</p>
                      {f.activatedAt && (
                        <p className="text-xs text-muted-foreground">
                          Since {formatDate(f.activatedAt)}
                        </p>
                      )}
                    </div>
                    {canAssign && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-destructive"
                        disabled={revoke.isPending}
                        onClick={() => onRevoke(f._id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Recent activity</p>
              {!activity || activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded.</p>
              ) : (
                <ul className="space-y-1.5">
                  {activity.slice(0, 15).map((item: AgentActivityItem) => (
                    <li
                      key={item._id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate">
                        {item.action.replace(/[._]/g, " ")}
                        {item.farmerId ? ` · ${refLabel(item.farmerId)}` : ""}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgentManager;
