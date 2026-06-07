import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmailVerificationStatus,
  useRequestEmailVerification,
  useResendEmailVerification,
  useVerifyEmailOtp,
} from "@/hooks/useEmailVerification";
import { api } from "@/lib/api";
import { CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const RESEND_COOLDOWN_SEC = 30;

const VerifyEmail = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const tokenFromLink = params.get("token");
  const { data: status, refetch } = useEmailVerificationStatus();
  const request = useRequestEmailVerification();
  const resend = useResendEmailVerification();
  const verify = useVerifyEmailOtp();
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [tokenState, setTokenState] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");

  const verified = useMemo(
    () =>
      status?.emailVerified ??
      (user as { emailVerified?: boolean } | null)?.emailVerified ??
      false,
    [status, user],
  );

  // Token-link verification
  useEffect(() => {
    if (!tokenFromLink || tokenState !== "idle") return;
    setTokenState("verifying");
    api
      .post("/auth/verify-email-token", { token: tokenFromLink })
      .then(() => {
        setTokenState("success");
        toast.success("Email verified");
        refetch();
      })
      .catch(() => setTokenState("error"));
  }, [tokenFromLink, tokenState, refetch]);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const startCooldown = () => setCooldown(RESEND_COOLDOWN_SEC);

  const handleRequest = () => {
    request.mutate(undefined, {
      onSuccess: () => {
        toast.success("Verification code sent");
        startCooldown();
      },
      onError: () => toast.error("Could not send code"),
    });
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    resend.mutate(undefined, {
      onSuccess: () => {
        toast.success("Code re-sent");
        startCooldown();
      },
      onError: () => toast.error("Could not resend code"),
    });
  };

  const handleVerify = () => {
    if (otp.length !== 6) return;
    verify.mutate(otp, {
      onSuccess: () => {
        toast.success("Email verified");
        setOtp("");
        refetch();
      },
      onError: () => toast.error("Invalid or expired code"),
    });
  };

  return (
    <div className="container max-w-xl py-10">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow">
            <Mail className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold">
              Verify your email
            </h1>
            <p className="text-sm text-muted-foreground">
              Optional — verification unlocks email notifications, trust badge
              and seller upgrades. You can keep using PhyhanAgro either way.
            </p>
          </div>
        </div>

        {verified ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="font-semibold">Email verified</p>
              <p className="text-xs text-muted-foreground">
                {status?.email ?? user?.email}
              </p>
            </div>
            <ShieldCheck className="ml-auto h-5 w-5 text-success" />
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Sending to
              </p>
              <p className="text-sm font-semibold">
                {status?.email ?? user?.email ?? "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Status:{" "}
                <span className="font-medium capitalize">
                  {status?.verificationStatus ?? "not_requested"}
                </span>
              </p>
            </div>

            {status?.verificationStatus !== "pending" && (
              <Button
                onClick={handleRequest}
                disabled={request.isPending}
                className="mt-4 h-11 w-full rounded-full bg-gradient-primary shadow-glow"
              >
                {request.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send verification code"
                )}
              </Button>
            )}

            <div className="mt-6 space-y-3">
              <label className="text-sm font-medium">Enter 6-digit code</label>
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
                inputMode="numeric"
                pattern={REGEXP_ONLY_DIGITS}
              >
                <InputOTPGroup className="justify-center gap-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              <Button
                onClick={handleVerify}
                disabled={otp.length !== 6 || verify.isPending}
                className="h-11 w-full rounded-full bg-gradient-primary shadow-glow"
              >
                {verify.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify email"
                )}
              </Button>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Didn't receive it?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resend.isPending}
                  className="rounded-full"
                >
                  {cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : resend.isPending
                      ? "Sending…"
                      : "Resend code"}
                </Button>
              </div>
            </div>
          </>
        )}

        {tokenState === "error" && (
          <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            That verification link is invalid or expired. Request a fresh code
            above.
          </p>
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <Link to="/marketplace" className="hover:text-primary">
            ← Continue to marketplace
          </Link>
          <Link to="/marketplace/profile" className="hover:text-primary">
            Profile settings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
