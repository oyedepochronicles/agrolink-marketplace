import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { portalPathFor } from "@/lib/authz";
import type { User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(128),
});
type FormValues = z.infer<typeof schema>;

const Login = () => {
  const { login, verifyMfaLogin, cancelMfa, mfaPending } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { from?: { pathname?: string; search?: string } };
  };
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const goToPortal = (user: User) => {
    const from = location.state?.from
      ? `${location.state.from.pathname ?? ""}${location.state.from.search ?? ""}`
      : undefined;
    const dest = from ?? portalPathFor(user);
    navigate(dest, { replace: true });
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const result = await login(values as Required<FormValues>);
      if (result.status === "mfa_required") {
        toast.info("Enter the code from your authenticator app");
        return;
      }
      toast.success(`Welcome back, ${result.user.name.split(" ")[0]}`);
      goToPortal(result.user);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await verifyMfaLogin(code.trim());
      toast.success("Verified");
      goToPortal(user);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (mfaPending) {
    return (
      <AuthLayout
        title="Two-factor verification"
        subtitle="Enter the 6-digit code from your authenticator app."
        footer={
          <button type="button" onClick={cancelMfa} className="font-semibold text-primary hover:underline">
            Use a different account
          </button>
        }
      >
        <form onSubmit={onVerifyMfa} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mfa-code">Authentication code</Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || code.length < 6}
            className="h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and continue"}
          </Button>
        </form>
        <AlertDialog open={!!error}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-red-600">Verification failed</AlertDialogTitle>
              <AlertDialogDescription className="text-center">{error}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setError(null)} className="w-full">
                Try again
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AuthLayout>
    );
  }


  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to PhyhanAgro."
      footer={
        <>
          New to PhyhanAgro?{" "}
          <Link
            to="/register"
            state={location.state}
            className="font-semibold text-primary hover:underline"
          >
            Create buyer account
          </Link>
          {" • "}
          <Link
            to="/affiliate"
            state={location.state}
            className="font-semibold text-primary hover:underline"
          >
            Join as farmer / rider
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      <AlertDialog open={!!error}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-red-600">
              Login Failed
            </AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              {error ?? "Invalid email or password"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => {
                setError(null);
                navigate("/forgot-password");
              }}
              className="w-full"
            >
              Forgot Password
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => setError(null)}
              className="w-full"
            >
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthLayout>
  );
};

export default Login;
