import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminVerification,
  useAdminVerifications,
  useReviewVerification,
} from "@/hooks/useAdmin";
import { apiErrorMessage, assetUrl } from "@/lib/api";
import { initials } from "@/lib/format";
import {
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AdminVerifications = () => {
  const { data: pending = [], isLoading } = useAdminVerifications();
  const review = useReviewVerification();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const { data: selected, isLoading: loadingDetails } =
    useAdminVerification(selectedId);

  const act = async (id: string, action: "approve" | "reject") => {
    const reason =
      action === "reject"
        ? window.prompt("Reason for rejection")?.trim()
        : undefined;
    if (action === "reject" && !reason) return;
    try {
      await review.mutateAsync({ id, action, reason });
      toast.success(
        action === "approve" ? "Account approved" : "Application rejected",
      );
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification queue"
        description="Review and approve farmer & rider applications."
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pending.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Nothing to review"
          description="All caught up! New applications will appear here."
        />
      ) : (
        <div className="grid gap-3">
          {pending.map((u) => (
            <Card key={u._id} className="rounded-2xl p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{u.name}</p>
                    <Badge variant="outline" className="capitalize">
                      {u.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {u.email} {u.phone && ` • ${u.phone}`}{" "}
                    {u.location?.state && ` • ${u.location.state}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedId(u._id)}
                  >
                    <FileText className="h-4 w-4" /> View details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => act(u._id, "reject")}
                    disabled={review.isPending}
                  >
                    <ShieldX className="h-4 w-4" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => act(u._id, "approve")}
                    disabled={review.isPending}
                  >
                    <ShieldCheck className="h-4 w-4" /> Approve
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 border-t pt-4 text-sm md:grid-cols-3">
                {u.role === "farmer" && (
                  <>
                    <Detail
                      icon={<MapPin className="h-4 w-4" />}
                      label="Farm"
                      value={u.farmerProfile?.farmName}
                    />
                    <Detail
                      icon={<MapPin className="h-4 w-4" />}
                      label="Pickup address"
                      value={
                        u.farmerProfile?.farmAddress || u.location?.fullAddress
                      }
                    />
                    <Detail
                      icon={<FileText className="h-4 w-4" />}
                      label="ID"
                      value={[
                        u.farmerProfile?.idType,
                        u.farmerProfile?.idNumber,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    />
                  </>
                )}
                {u.role === "rider" && (
                  <>
                    <Detail
                      icon={<FileText className="h-4 w-4" />}
                      label="Vehicle"
                      value={[
                        u.riderProfile?.vehicleType,
                        u.riderProfile?.vehicleNumber,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    />
                    <Detail
                      icon={<FileText className="h-4 w-4" />}
                      label="License"
                      value={u.riderProfile?.licenseNumber}
                    />
                    <Detail
                      icon={<MapPin className="h-4 w-4" />}
                      label="Location"
                      value={u.location?.fullAddress || u.location?.state}
                    />
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(undefined)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Verification details</DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : selected ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <Detail
                  label="Applicant"
                  value={`${selected.name} (${selected.role})`}
                />
                <Detail
                  label="Contact"
                  value={[selected.email, selected.phone]
                    .filter(Boolean)
                    .join(" • ")}
                />
                <Detail label="Status" value={selected.verificationStatus} />
                <Detail
                  label="Submitted"
                  value={
                    selected.verificationSubmittedAt
                      ? new Date(
                          selected.verificationSubmittedAt,
                        ).toLocaleString()
                      : undefined
                  }
                />
              </div>
              {selected.role === "farmer" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <Detail
                    label="Farm name"
                    value={selected.farmerProfile?.farmName}
                  />
                  <Detail
                    label="Farm address"
                    value={
                      selected.farmerProfile?.farmAddress ||
                      selected.location?.fullAddress
                    }
                  />
                  <Detail
                    label="Farm location"
                    value={[
                      selected.farmerProfile?.farmLga,
                      selected.farmerProfile?.farmState,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Detail
                    label="ID information"
                    value={[
                      selected.farmerProfile?.idType,
                      selected.farmerProfile?.idNumber,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  />
                </div>
              )}
              {selected.role === "rider" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <Detail
                    label="Vehicle"
                    value={[
                      selected.riderProfile?.vehicleType,
                      selected.riderProfile?.vehicleNumber,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  />
                  <Detail
                    label="License"
                    value={selected.riderProfile?.licenseNumber}
                  />
                  <Detail
                    label="ID information"
                    value={selected.riderProfile?.idType}
                  />
                  <Detail
                    label="Location"
                    value={
                      selected.location?.fullAddress || selected.location?.state
                    }
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <DocumentLink
                  label="ID document"
                  url={
                    selected.farmerProfile?.idDocumentUrl ||
                    selected.riderProfile?.idDocumentUrl ||
                    selected.buyerProfile?.idDocumentUrl
                  }
                />
                <DocumentLink
                  label="Farm photo"
                  url={selected.farmerProfile?.farmPhotoUrl}
                />
                <DocumentLink
                  label="Driver license"
                  url={selected.riderProfile?.driverLicenseUrl}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Detail = ({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
}) => (
  <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3">
    {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "Not provided"}</p>
    </div>
  </div>
);

const DocumentLink = ({ label, url }: { label: string; url?: string }) =>
  url ? (
    <Button variant="outline" size="sm" asChild>
      <a href={assetUrl(url)} target="_blank" rel="noreferrer">
        <ExternalLink className="h-4 w-4" /> {label}
      </a>
    </Button>
  ) : null;

export default AdminVerifications;
