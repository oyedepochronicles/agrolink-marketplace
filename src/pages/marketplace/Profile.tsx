import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { EditProfileFieldDialog } from "@/components/profile/EditProfileFieldDialog";
import { RoleUpgradeDialog } from "@/components/profile/RoleUpgradeDialog";
import { VerificationRequestDialog } from "@/components/profile/VerificationRequestDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateAvatar } from "@/hooks/useProfile";
import { apiErrorMessage } from "@/lib/api";
import { initials } from "@/lib/format";
import {
  AlertCircle,
  Camera,
  HelpCircle,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Verified,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";

const Profile = () => {
  const { user, logout } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const updateAvatar = useUpdateAvatar();

  if (!user) return <Navigate to="/login" replace />;

  const isVerified = user.isVerified || user.verificationStatus === "approved";
  const isPending =
    user.verificationStatus === "pending" ||
    user.verificationStatus === "pending_verification";

  const onPick = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar must be ≤5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Image files only");
      return;
    }
    setBusy(true);
    try {
      await updateAvatar.mutateAsync(file);
      toast.success("Avatar updated");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="bg-gradient-hero p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-white/30">
                <AvatarImage src={user.profileImage} alt={user.name} />
                <AvatarFallback className="bg-white/10 text-lg font-bold text-white">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                aria-label="Change avatar"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow ring-2 ring-white disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0])}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-extrabold">
                {user.name}
              </h1>
              <p className="text-sm capitalize text-white/80">
                {user.role} account
              </p>
              <div className="mt-2">
                {isVerified ? (
                  <Badge className="border-0 bg-white/15 text-white">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                ) : isPending ? (
                  <Badge className="border-0 bg-warning/30 text-white">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />{" "}
                    Verification pending
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-white/15 text-white">
                    <ShieldAlert className="mr-1 h-3 w-3" /> Not verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1 p-6 md:p-8">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Email and phone changes require OTP verification.
          </div>
          <Row
            icon={<UserIconLucide />}
            label="Name"
            value={user.name}
            field="name"
            requiresOtp={false}
          />
          <Row
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={user.email}
            field="email"
            verified={user.isEmailVerified}
            requiresOtp
          />
          <Row
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={user.phone ?? "—"}
            field="phone"
            verified={user.phoneVerified}
            requiresOtp
          />
          {user.state && (
            <Row
              icon={<ShieldCheck className="h-4 w-4" />}
              label="State"
              value={user.state}
            />
          )}


          <div className="flex flex-wrap items-center justify-end gap-2 pt-6">
            <ChangePasswordDialog
              trigger={
                <Button variant="outline" className="rounded-full">
                  <Lock className="mr-2 h-4 w-4" /> Change password
                </Button>
              }
            />
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/marketplace/support">
                <HelpCircle className="mr-2 h-4 w-4" /> Contact support
              </Link>
            </Button>
            {user.role === "buyer" && !user.requestedRole && (
              <RoleUpgradeDialog
                trigger={
                  <Button className="rounded-full bg-gradient-primary shadow-glow">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Request role
                    upgrade
                  </Button>
                }
              />
            )}
            {!isVerified && !isPending && (
              <VerificationRequestDialog
                trigger={
                  <Button className="rounded-full bg-gradient-primary shadow-glow">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Request
                    verification
                  </Button>
                }
              />
            )}
            {user.role === "buyer" && user.requestedRole && (
              <Badge className="rounded-full bg-warning/20 text-warning">
                Upgrade request pending: {user.requestedRole}
              </Badge>
            )}
            <Button onClick={logout} variant="outline" className="rounded-full">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserIconLucide = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Row = ({
  icon,
  label,
  value,
  verified,
  field,
  requiresOtp,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified?: boolean;
  field?: "name" | "email" | "phone";
  requiresOtp?: boolean;
}) => {
  const statusText = verified
    ? `${label} is verified`
    : `${label} is not verified`;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="flex min-w-0 items-center gap-3 text-sm text-muted-foreground">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          {icon}
        </span>
        <span className="shrink-0">{label}</span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <p className="truncate text-sm font-semibold">{value}</p>

        {typeof verified === "boolean" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-pointer">
                  {verified ? (
                    <Verified className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{statusText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {field && (
          <EditProfileFieldDialog
            field={field}
            trigger={
              <button
                type="button"
                aria-label={`Edit ${label}`}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default Profile;

