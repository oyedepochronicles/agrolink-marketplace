import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminTickets,
  useReplyTicket,
  useSupportAssignees,
  useTicket,
  useUpdateTicketWorkflow,
  useUpdateTicketStatus,
} from "@/hooks/useSupport";
import { apiErrorMessage } from "@/lib/api";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SupportTicketDepartment, SupportTicketPriority, SupportTicketStatus } from "@/types";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_OPTIONS: SupportTicketStatus[] = [
  "open",
  "pending",
  "escalated",
  "waiting_customer",
  "resolved",
  "closed",
];
const DEPARTMENTS: SupportTicketDepartment[] = ["support", "finance", "operations", "pickup", "warehouse", "logistics", "technical", "risk_compliance", "quality", "admin", "engineering"];
const PRIORITIES: SupportTicketPriority[] = ["low", "normal", "high", "urgent"];
const STATUS_TONE: Record<SupportTicketStatus, string> = {
  open: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-warning/10 text-warning-foreground border-warning/40",
  escalated: "bg-destructive/10 text-destructive border-destructive/30",
  waiting_customer: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  resolved: "bg-success/10 text-success-foreground border-success/40",
  closed: "bg-muted text-muted-foreground border-border",
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const AdminSupport = () => {
  const [filter, setFilter] = useState<SupportTicketStatus | "all">("open");
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  const { data: tickets = [], isLoading } = useAdminTickets(
    filter === "all" ? undefined : filter,
  );
  const { data: active } = useTicket(activeId);
  const reply = useReplyTicket(activeId);
  const updateStatus = useUpdateTicketStatus(activeId);
  const updateWorkflow = useUpdateTicketWorkflow(activeId);
  const { data: assignees = [] } = useSupportAssignees();
  const [body, setBody] = useState("");

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    try {
      await reply.mutateAsync(text);
      setBody("");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const changeStatus = async (s: SupportTicketStatus) => {
    try {
      await updateStatus.mutateAsync(s);
      toast.success(`Marked ${s}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const changeWorkflow = async (
    input: { department?: SupportTicketDepartment; priority?: SupportTicketPriority; assignedTo?: string | null },
  ) => {
    try {
      await updateWorkflow.mutateAsync(input);
      toast.success("Case workflow updated");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support tickets"
        description="One shared case queue for Support, Finance, Operations, Technical and Compliance teams."
      />

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as SupportTicketStatus | "all")}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {STATUS_OPTIONS.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px),1fr]">
        <div className="space-y-2">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-6 w-6" />}
              title="No tickets"
              description="You're all caught up."
            />
          ) : (
            tickets.map((t) => (
              <button
                key={t._id}
                onClick={() => setActiveId(t._id)}
                className="w-full text-left"
              >
                <Card
                  className={cn(
                    "rounded-2xl p-3 transition-base hover:border-primary/50",
                    activeId === t._id && "border-primary shadow-glow",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={t.user?.profileImage}
                        alt={t.user?.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {initials(t.user?.name ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {t.subject}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.user?.name} · {t.department ?? "support"} · {formatDateTime(t.updatedAt)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 capitalize",
                        STATUS_TONE[t.status],
                      )}
                    >
                      {t.status}
                    </Badge>
                  </div>
                </Card>
              </button>
            ))
          )}
        </div>

        <div>
          {!active ? (
            <Card className="flex h-full min-h-[300px] items-center justify-center rounded-2xl text-sm text-muted-foreground">
              Select a ticket to view the thread.
            </Card>
          ) : (
            <Card className="flex h-full flex-col rounded-2xl">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-extrabold">
                    {active.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {active.user?.name} · {active.user?.email}
                  </p>
                </div>
                <Select
                  value={active.status}
                  onValueChange={(v) => changeStatus(v as SupportTicketStatus)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2 border-b border-border px-4 pb-3">
                <Select
                  value={active.department ?? "support"}
                  onValueChange={(department) => changeWorkflow({ department: department as SupportTicketDepartment })}
                  disabled={updateWorkflow.isPending}
                >
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((department) => <SelectItem key={department} value={department} className="capitalize">{department.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={active.priority ?? "normal"}
                  onValueChange={(priority) => changeWorkflow({ priority: priority as SupportTicketPriority })}
                  disabled={updateWorkflow.isPending}
                >
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => <SelectItem key={priority} value={priority} className="capitalize">{priority}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={active.assignedTo?._id ?? "unassigned"}
                  onValueChange={(assignedTo) => changeWorkflow({ assignedTo: assignedTo === "unassigned" ? null : assignedTo })}
                  disabled={updateWorkflow.isPending}
                >
                  <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Assign staff" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assignees.map((assignee) => <SelectItem key={assignee._id} value={assignee._id}>{assignee.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {active.assignedTo && <Badge variant="outline" className="h-8">Assigned: {active.assignedTo.name}</Badge>}
                {active.slaDueAt && <Badge variant="outline" className="h-8">SLA: {formatDateTime(active.slaDueAt)}</Badge>}
              </div>

              <div className="space-y-3 overflow-y-auto p-4">
                <div className="rounded-2xl bg-secondary p-3 text-sm">
                  <p className="mb-1 text-[11px] font-semibold text-muted-foreground">
                    {active.user?.name} · {formatDateTime(active.createdAt)}
                  </p>
                  <p className="whitespace-pre-wrap">{active.body}</p>
                </div>
                {(active.replies ?? []).map((r) => {
                  const isAdmin =
                    r.author?.role === "admin" ||
                    r.author?.role === "super_admin";
                  return (
                    <div
                      key={r._id}
                      className={cn(
                        "rounded-2xl p-3 text-sm",
                        isAdmin ? "ml-6 bg-primary/10" : "mr-6 bg-secondary",
                      )}
                    >
                      <p className="mb-1 text-[11px] font-semibold text-muted-foreground">
                        {isAdmin ? "Support" : r.author?.name} ·{" "}
                        {formatDateTime(r.createdAt)}
                      </p>
                      <p className="whitespace-pre-wrap">{r.body}</p>
                    </div>
                  );
                })}
                {(active.events?.length ?? 0) > 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Case activity</p>
                    <div className="space-y-1.5">
                      {active.events?.map((event) => (
                        <p key={event._id} className="text-xs text-muted-foreground">
                          {event.message ?? event.type} · {event.actor?.name ?? "System"} · {formatDateTime(event.createdAt)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {active.status !== "closed" && (
                <div className="border-t border-border p-3">
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Reply to user..."
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      onClick={submit}
                      disabled={reply.isPending || !body.trim()}
                    >
                      {reply.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
