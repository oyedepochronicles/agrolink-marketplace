import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage, classifyError } from "@/lib/api";
import { isAdmin } from "@/lib/authz";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

/** Dedicated, isolated entry point for the admin console. */
const AdminLogin = () => {
  const { user, login, verifyMfaLogin, cancelMfa, mfaPending, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user && isAdmin(user)) return <Navigate to="/admin" replace />;

  const finish = (u: { role: string }) => {
    if (!isAdmin(u as never)) {
      logout();
      setError("This account cannot access the admin console.");
      return;
    }
    toast.success("Signed in");
    navigate("/admin", { replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await login({ email: email.trim(), password });
      if (res.status === "mfa_required") return;
      finish(res.user);
    } catch (err) {
      setError(
        classifyError(err) === "network_restricted"
          ? "Admin access is restricted to the approved network. Connect through the approved VPN and try again."
          : apiErrorMessage(err),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      finish(await verifyMfaLogin(code.trim()));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-sm rounded-2xl bg-background p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-xl font-extrabold tracking-tight">Admin console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mfaPending ? "Enter your authenticator code." : "Authorized personnel only."}
          </p>
        </div>

        {mfaPending ? (
          <form onSubmit={verify} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-code">Authentication code</Label>
              <Input
                id="admin-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting || code.length < 6} className="h-11 w-full rounded-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
            </Button>
            <button
              type="button"
              onClick={cancelMfa}
              className="w-full text-center text-xs text-muted-foreground hover:underline"
            >
              Cancel
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <PasswordInput
                id="admin-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting || !email || !password} className="h-11 w-full rounded-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
};

export default AdminLogin;
