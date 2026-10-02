import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAgentAssignments,
  useAgentMe,
  useEndAssignment,
  useRequestFarmer,
  useRespondToAssignment,
} from "@/hooks/useAgentPortal";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { refId, refLabel, refUser, type AgentAssignment } from "@/types/agents";
import { Loader2, MapPin, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const AgentFarmers = () => {
  const { data: profile } = useAgentMe();
  const isActive = profile?.status === "active";
  const { data: assignments, isLoading, error } = useAgentAssignments();
  const requestFarmer = useRequestFarmer();
  const respond = useRespondToAssignment();
  const endAssignment = useEndAssignment();

  const [email, setEmail] = useState("");

  const { active, invites, requests } = useMemo(() => {
    const all = assignments ?? [];
    return {
      active: all.filter((a) => a.status === "active"),
      // A farmer invited this agent — the agent accepts/declines.
      invites: all.filter((a) => a.status === "pending" && a.initiatedBy === "farmer"),
      // This agent requested a farmer — awaiting the farmer's response.
      requests: all.filter((a) => a.status === "pending" && a.initiatedBy === "agent"),
    };
  }, [assignments]);

  const submitRequest = async () => {
    if (!email.trim()) return toast.error("Enter the farmer's email");
    try {
      await requestFarmer.mutateAsync(email.trim());
      toast.success("Request sent to the farmer");
      setEmail("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const onRespond = async (id: string, accept: boolean) => {
    try {
      await respond.mutateAsync({ id, accept });
      toast.success(accept ? "Invitation accepted" : "Invitation declined");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const onEnd = async (id: string) => {
    try {
      await endAssignment.mutateAsync({ id });
      toast.success("Assignment ended");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (isLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farmers"
        description="The farmers you represent, invitations to accept, and requests you've sent. You can only act for a farmer once the assignment is active."
      />

      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {apiErrorMessage(error)}
        </p>
      ) : (
        <>
          {/* Request a farmer (active agents only) */}
          {isActive && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request a farmer</CardTitle>
                <CardDescription>
                  Enter a farmer's email to ask to represent them. They must accept before you can act
                  on their behalf.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="farmer-email">Farmer email</Label>
                    <Input
                      id="farmer-email"
                      type="email"
                      placeholder="farmer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    className="rounded-full"
                    onClick={submitRequest}
                    disabled={requestFarmer.isPending}
                  >
                    {requestFarmer.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Send request
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Incoming invitations */}
          {invites.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Invitations ({invites.length})
              </h2>
              {invites.map((a) => (
                <FarmerRow key={a._id} assignment={a}>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={respond.isPending || !isActive}
                      onClick={() => onRespond(a._id, true)}
                    >
                      Accept
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
                </FarmerRow>
              ))}
              {!isActive && (
                <p className="text-xs text-muted-foreground">
                  You must be an active agent to accept invitations.
                </p>
              )}
            </section>
          )}

          {/* Outgoing requests */}
          {requests.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Pending requests ({requests.length})
              </h2>
              {requests.map((a) => (
                <FarmerRow key={a._id} assignment={a}>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-full">
                      Awaiting farmer
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-destructive"
                      disabled={endAssignment.isPending}
                      onClick={() => onEnd(a._id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </FarmerRow>
              ))}
            </section>
          )}

          {/* Active roster */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Active farmers ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                You are not representing any farmers yet.
              </p>
            ) : (
              active.map((a) => (
                <FarmerRow key={a._id} assignment={a}>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="rounded-full">
                      <Link to={`/agent/farmers/${refId(a.farmerId)}/products`}>Manage products</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-destructive"
                      disabled={endAssignment.isPending}
                      onClick={() => onEnd(a._id)}
                    >
                      End
                    </Button>
                  </div>
                </FarmerRow>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
};

const FarmerRow = ({
  assignment,
  children,
}: {
  assignment: AgentAssignment;
  children: React.ReactNode;
}) => {
  const farmer = refUser(assignment.farmerId);
  const location = farmer?.location;
  const place = [location?.lga, location?.state].filter(Boolean).join(", ");
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{refLabel(assignment.farmerId)}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {farmer?.email && <span>{farmer.email}</span>}
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

export default AgentFarmers;
