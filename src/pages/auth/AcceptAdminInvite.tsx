import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAcceptAdminInvite } from "@/hooks/useSecurity";
import { apiErrorMessage } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const AcceptAdminInvite = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const accept = useAcceptAdminInvite();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    try {
      await accept.mutateAsync({ token, password });
      toast.success("Account activated. Sign in and set up MFA.");
      navigate("/admin/login", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid invitation" subtitle="This invitation link is missing or malformed.">
        <p className="text-sm text-muted-foreground">
          Ask a super admin to resend your invitation.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Activate your admin account"
      subtitle="Choose a password. You'll set up two-factor authentication right after signing in."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <PasswordInput id="pw" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw2">Confirm password</Label>
          <PasswordInput id="pw2" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={accept.isPending} className="h-11 w-full rounded-full">
          {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate account"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default AcceptAdminInvite;
