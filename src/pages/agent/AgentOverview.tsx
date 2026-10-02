import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAgentEarnings, useAgentMe, useApplyAsAgent } from "@/hooks/useAgentPortal";
import { apiErrorMessage } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import type { AgentStatus } from "@/types/agents";
import { Loader2, PackageCheck, ShoppingBag, Sprout, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_NOTE: Record<AgentStatus, { title: string; tone: string } | null> = {
  active: null,
  pending: {
    title: "Your application is under review",
    tone: "border-amber-500/30 bg-amber-500/5 text-amber-700",
  },
  suspended: {
    title: "Your agent account is suspended",
    tone: "border-destructive/30 bg-destructive/5 text-destructive",
  },
  rejected: {
    title: "Your agent application was declined",
    tone: "border-destructive/30 bg-destructive/5 text-destructive",
  },
};

const AgentOverview = () => {
  const { data: profile, isLoading } = useAgentMe();
  const apply = useApplyAsAgent();
  const isActive = profile?.status === "active";
  const { data: earnings } = useAgentEarnings(isActive);

  const [note, setNote] = useState("");
  useEffect(() => {
    if (profile?.applicationNote) setNote(profile.applicationNote);
  }, [profile?.applicationNote]);

  const submitApplication = async () => {
    try {
      await apply.mutateAsync(note.trim() || undefined);
      toast.success(profile ? "Application updated" : "Application submitted");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (isLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  // Not onboarded yet — show the application form.
  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Become a Farm Agent"
          description="Apply to represent farmers on PhyhanAgro. Once an administrator approves you, farmers can invite you (or you can request them) and you'll manage listings and orders on their behalf."
        />
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Agent application</CardTitle>
            <CardDescription>
              Tell us about your experience supporting farmers. An administrator reviews every
              application before it is approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="application-note">Application note (optional)</Label>
              <Textarea
                id="application-note"
                rows={4}
                placeholder="How do you support farmers, and which areas do you cover?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button className="rounded-full" onClick={submitApplication} disabled={apply.isPending}>
              {apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const note_ = STATUS_NOTE[profile.status];
  const reason =
    profile.status === "suspended"
      ? profile.suspensionReason
      : profile.status === "rejected"
        ? profile.rejectionReason
        : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Your Farm Agent dashboard — status, the farmers you serve, and on-behalf activity."
      />

      {note_ && (
        <div className={`rounded-2xl border p-5 ${note_.tone}`}>
          <p className="font-semibold">{note_.title}</p>
          {reason && <p className="mt-1 text-sm">Reason: {reason}</p>}
          {profile.status === "pending" && (
            <p className="mt-1 text-sm">
              You can update your application note below while you wait.
            </p>
          )}
        </div>
      )}

      {isActive && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Sprout className="h-5 w-5 text-primary" />}
              label="Active farmers"
              value={String(earnings?.activeFarmers ?? profile.activeFarmerCount ?? 0)}
            />
            <StatCard
              icon={<ShoppingBag className="h-5 w-5 text-primary" />}
              label="Orders facilitated"
              value={String(earnings?.ordersFacilitated ?? 0)}
            />
            <StatCard
              icon={<PackageCheck className="h-5 w-5 text-primary" />}
              label="Paid orders"
              value={String(earnings?.paidOrdersFacilitated ?? 0)}
            />
            <StatCard
              icon={<Wallet className="h-5 w-5 text-primary" />}
              label="Gross facilitated"
              value={formatNaira(earnings?.grossFacilitated ?? 0)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission &amp; payouts</CardTitle>
              <CardDescription>
                Agent commission is not yet configured. Once the platform fee schedule is published,
                your commission and payout records will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="rounded-full">
                Not yet configured
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Manage the farmers you serve</p>
                <p className="text-sm text-muted-foreground">
                  Accept invitations, request farmers, and manage their listings on their behalf.
                </p>
              </div>
              <Button asChild className="rounded-full">
                <Link to="/agent/farmers">Go to farmers</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Pending applicants can still refine their note. */}
      {profile.status === "pending" && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Application note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
            <Button
              variant="outline"
              className="rounded-full"
              onClick={submitApplication}
              disabled={apply.isPending}
            >
              {apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update application
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <Card>
    <CardContent className="flex items-center gap-3 pt-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default AgentOverview;
