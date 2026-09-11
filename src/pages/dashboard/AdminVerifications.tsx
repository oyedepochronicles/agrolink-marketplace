import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminVerifications, useReviewVerification } from "@/hooks/useAdmin";
import { apiErrorMessage } from "@/lib/api";
import { initials } from "@/lib/format";
import { User } from "@/types";
import { FileText, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminVerifications = () => {
  const { data: pending = [], isLoading } = useAdminVerifications();
  const review = useReviewVerification();
  const navigate = useNavigate();

  // Quick-approve from the queue. Rejection requires a reason and is handled on
  // the dedicated review page (/admin/verifications/:id).
  const approve = async (u: User) => {
    try {
      await review.mutateAsync({ id: u._id, action: "approve" });
      toast.success("Account approved");
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
                  <AvatarImage src={u.profileImage} alt={u.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{u.name}</p>
                    <Badge variant="outline" className="capitalize">
                      {u.requestedRole
                        ? u.role + " → " + u.requestedRole
                        : u.role}
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
                    onClick={() => navigate(`/admin/verifications/${u._id}`)}
                  >
                    <FileText className="h-4 w-4" /> View details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approve(u)}
                    disabled={review.isPending}
                  >
                    <ShieldCheck className="h-4 w-4" /> Approve
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 border-t pt-4 text-sm md:grid-cols-3">
                {(u.role === "farmer" || u.requestedRole === "farmer") && (
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
                {(u.role === "rider" || u.requestedRole === "rider") && (
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

export default AdminVerifications;
