import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInviteAgent,
  useMyAgents,
  useRemoveMyAgent,
  useRespondToAgentRequest,
} from "@/hooks/useMyAgent";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { refLabel, refUser, type AgentAssignment } from "@/types/agents";
import { Loader2, MapPin, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const FarmerAgent = () => {
  const { data: assignments, isLoading, error } = useMyAgents();
  const invite = useInviteAgent();
  const respond = useRespondToAgentRequest();
  const remove = useRemoveMyAgent();

  const [email, setEmail] = useState("");

  const { active, requests, invites } = useMemo(() => {
    const all = assignments ?? [];
    return {
      active: all.filter((a) => a.status === "active"),
      // An agent asked to represent this farmer — the farmer accepts/declines.
      requests: all.filter((a) => a.status === "pending" && a.initiatedBy === "agent"),
      // This farmer invited an agent — awaiting the agent's response.
      invites: all.filter((a) => a.status === "pending" && a.initiatedBy === "farmer"),
    };
  }, [assignments]);

  const hasActive = active.length > 0;

  const submitInvite = async () => {
    if (!email.trim()) return toast.error("Enter the agent's email");
    try {
      await invite.mutateAsync(email.trim());
      toast.success("Invitation sent to the agent");
      setEmail("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const onRespond = async (id: string, accept: boolean) => {
    try {
      await respond.mutateAsync({ id, accept });
      toast.success(accept ? "Agent approved" : "Request declined");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const onRemove = async (id: string) => {
    try {
      await remove.mutateAsync({ id });
      toast.success("Agent removed");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (isLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My agent"
        description="A Farm Agent can manage your listings and orders on your behalf. You stay in control — approve who represents you and remove them at any time."
      />

      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {apiErrorMessage(error)}
        </p>
      ) : (
        <>
          {/* Invite an agent (only when you don't already have an active one). */}
          {!hasActive && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invite an agent</CardTitle>
                <CardDescription>
                  Enter an approved agent's email to invite them. They must accept before they can act
                  for you, and you can only have one active agent at a time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="agent-email">Agent email</Label>
                    <Input
                      id="agent-email"
                      type="email"
                      placeholder="agent@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button className="rounded-full" onClick={submitInvite} disabled={invite.isPending}>
                    {invite.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Send invite
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Incoming requests from agents */}
          {requests.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Requests ({requests.length})
              </h2>
              {requests.map((a) => (
                <AgentRow key={a._id} assignment={a}>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={respond.isPending || hasActive}
                      onClick={() => onRespond(a._id, true)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={respond.isPending}
                      onClick={() => onRespond(a._id, false)}
                    >
                      Decline
                    </Button>
                  </div>
                </AgentRow>
              ))}
              {hasActive && (
                <p className="text-xs text-muted-foreground">
                  Remove your current agent before approving a new one.
                </p>
              )}
            </section>
          )}

          {/* Outgoing invites */}
          {invites.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Pending invitations ({invites.length})
              </h2>
              {invites.map((a) => (
                <AgentRow key={a._id} assignment={a}>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-full">
                      Awaiting agent
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-destructive"
                      disabled={remove.isPending}
                      onClick={() => onRemove(a._id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </AgentRow>
              ))}
            </section>
          )}

          {/* Current agent */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Current agent</h2>
            {!hasActive ? (
              <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                You don't have an agent yet. Invite one above, or approve a request when an agent asks
                to represent you.
              </p>
            ) : (
              active.map((a) => (
                <AgentRow key={a._id} assignment={a}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    disabled={remove.isPending}
                    onClick={() => onRemove(a._id)}
                  >
                    Remove
                  </Button>
                </AgentRow>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
};

const AgentRow = ({
  assignment,
  children,
}: {
  assignment: AgentAssignment;
  children: React.ReactNode;
}) => {
  const agent = refUser(assignment.agentId);
  const location = agent?.location;
  const place = [location?.lga, location?.state].filter(Boolean).join(", ");
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{refLabel(assignment.agentId)}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {agent?.email && <span>{agent.email}</span>}
            {agent?.phone && <span>{agent.phone}</span>}
            {place && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {place}
              </span>
            )}
            {assignment.activatedAt && <span>Since {formatDate(assignment.activatedAt)}</span>}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
};

export default FarmerAgent;
