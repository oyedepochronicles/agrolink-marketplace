import { PageHeader } from "@/components/dashboard/PageHeader";
import { SecureDocument } from "@/components/admin/SecureDocument";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminVerification, useReviewVerification } from "@/hooks/useAdmin";
import { apiErrorMessage } from "@/lib/api";
import { initials } from "@/lib/format";
import type { User } from "@/types";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const statusVariant = (
  status?: string,
): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
};

const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : undefined);

const AdminVerificationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useAdminVerification(id);
  const review = useReviewVerification();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const roleLabel = (u: User) =>
    u.requestedRole ? `${u.role} → ${u.requestedRole}` : u.role;
  const isFarmer = (u: User) =>
    u.role === "farmer" || u.requestedRole === "farmer";
  const isRider = (u: User) =>
    u.role === "rider" || u.requestedRole === "rider";

  const approve = async () => {
    if (!id) return;
    try {
      await review.mutateAsync({ id, action: "approve" });
      toast.success("Account approved");
      navigate("/admin/verifications");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const reject = async () => {
    if (!id) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("A rejection reason is required");
      return;
    }
    try {
      await review.mutateAsync({ id, action: "reject", reason: trimmed });
      toast.success("Application rejected");
      setRejectOpen(false);
      navigate("/admin/verifications");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate("/admin/verifications")} />
        <Card className="rounded-2xl p-6 text-sm text-muted-foreground">
          This application could not be loaded. It may have been removed or
          already actioned.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton onClick={() => navigate("/admin/verifications")} />

      <PageHeader
        title="Verification review"
        description="Review the applicant's details and submitted documents before deciding."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setRejectOpen(true)}
              disabled={review.isPending}
            >
              <ShieldX className="h-4 w-4" /> Reject
            </Button>
            <Button onClick={approve} disabled={review.isPending}>
              {review.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}{" "}
              Approve
            </Button>
          </div>
        }
      />

      {/* Applicant identity */}
      <Card className="rounded-2xl p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.profileImage} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-extrabold">
                {user.name}
              </h3>
              <Badge variant="outline" className="capitalize">
                {roleLabel(user)}
              </Badge>
              <Badge
                variant={statusVariant(user.verificationStatus)}
                className="capitalize"
              >
                {user.verificationStatus ?? "unknown"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[user.email, user.phone].filter(Boolean).join("  •  ")}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Status & timeline */}
        <Section title="Status & timeline">
          <Detail label="Current status" value={user.verificationStatus} />
          <Detail label="Submitted" value={fmt(user.verificationSubmittedAt)} />
          <Detail label="Reviewed" value={fmt(user.verificationReviewedAt)} />
          <Detail label="Member since" value={fmt(user.createdAt)} />
          {user.verificationRejectionReason && (
            <Detail
              label="Previous rejection reason"
              value={user.verificationRejectionReason}
              full
            />
          )}
        </Section>

        {/* Location */}
        <Section title="Location">
          <Detail label="State" value={user.location?.state} />
          <Detail label="LGA" value={user.location?.lga} />
          <Detail
            label="Full address"
            value={user.location?.fullAddress}
            full
          />
          <Detail label="Landmark" value={user.location?.landmark} full />
        </Section>

        {/* Farmer profile */}
        {isFarmer(user) && (
          <Section title="Farmer profile">
            <Detail label="Farm name" value={user.farmerProfile?.farmName} />
            <Detail
              label="Farm phone"
              value={user.farmerProfile?.farmPhone}
            />
            <Detail
              label="Farm address"
              value={
                user.farmerProfile?.farmAddress || user.location?.fullAddress
              }
              full
            />
            <Detail
              label="Farm location"
              value={[user.farmerProfile?.farmLga, user.farmerProfile?.farmState]
                .filter(Boolean)
                .join(", ")}
            />
            <Detail label="Landmark" value={user.farmerProfile?.farmLandmark} />
            <Detail
              label="ID information"
              value={[user.farmerProfile?.idType, user.farmerProfile?.idNumber]
                .filter(Boolean)
                .join("  •  ")}
              full
            />
          </Section>
        )}

        {/* Rider profile */}
        {isRider(user) && (
          <Section title="Rider profile">
            <Detail label="Vehicle type" value={user.riderProfile?.vehicleType} />
            <Detail
              label="Vehicle number"
              value={user.riderProfile?.vehicleNumber}
            />
            <Detail
              label="License number"
              value={user.riderProfile?.licenseNumber}
            />
            <Detail label="ID type" value={user.riderProfile?.idType} />
          </Section>
        )}

        {/* Buyer ID (when only a buyer identity doc exists) */}
        {user.buyerProfile?.idType && (
          <Section title="Buyer identity">
            <Detail label="ID type" value={user.buyerProfile?.idType} />
          </Section>
        )}
      </div>

      {/* Submitted documents — loaded only through the authenticated secure endpoint */}
      <div>
        <h3 className="mb-3 font-display text-lg font-extrabold">
          Submitted documents
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <SecureDocument
            label="ID document"
            url={
              user.farmerProfile?.idDocumentUrl ||
              user.riderProfile?.idDocumentUrl ||
              user.buyerProfile?.idDocumentUrl
            }
          />
          {isFarmer(user) && (
            <SecureDocument
              label="Farm photo"
              url={user.farmerProfile?.farmPhotoUrl}
            />
          )}
          {isRider(user) && (
            <SecureDocument
              label="Driver's license"
              url={user.riderProfile?.driverLicenseUrl}
            />
          )}
        </div>
      </div>

      {/* Reject reason dialog (replaces the raw window.prompt) */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Tell the applicant why their verification was rejected. This is
              shared with them so they can resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Document is blurry / does not match the provided name."
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={reject}
              disabled={review.isPending || !reason.trim()}
            >
              {review.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <Button variant="ghost" size="sm" className="gap-1 pl-1" onClick={onClick}>
    <ArrowLeft className="h-4 w-4" /> Back to queue
  </Button>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="rounded-2xl p-5 shadow-card">
    <h3 className="mb-3 font-display text-lg font-extrabold">{title}</h3>
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  </Card>
);

const Detail = ({
  label,
  value,
  full,
}: {
  label: string;
  value?: string;
  full?: boolean;
}) => (
  <div className={`rounded-lg bg-secondary/50 p-3 ${full ? "sm:col-span-2" : ""}`}>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-0.5 break-words font-medium">{value || "Not provided"}</p>
  </div>
);

export default AdminVerificationDetail;
