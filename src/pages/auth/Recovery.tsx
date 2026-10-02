import { AuthLayout } from "@/components/auth/AuthLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getRecoveryDeviceId,
  useRecoveryAppeal,
  useRecoveryComplete,
  useRecoveryReenroll,
  useRecoveryResend,
  useRecoveryStart,
  useRecoveryUploadDocument,
  useRecoveryVerifyCode,
  type RecoveryContactMethod,
  type RecoveryReenrollResult,
  type RecoverySession,
} from "@/hooks/useRecovery";
import { apiErrorMessage } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Copy,
  Loader2,
  LifeBuoy,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import QrCode from "qrcode";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

type Step =
  | "start"
  | "verify"
  | "reenroll"
  | "done"
  | "blocked"
  | "appeal"
  | "appeal_submitted";

const statusOf = (err: unknown): number | undefined =>
  (err as { response?: { status?: number } })?.response?.status;

const appealSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  contact: z.string().trim().min(3, "Enter the email or phone on the account"),
  reason: z
    .string()
    .trim()
    .min(10, "Please describe what happened (at least 10 characters)")
    .max(500),
  explanation: z.string().trim().max(2000).optional(),
});
type AppealValues = z.infer<typeof appealSchema>;

const Recovery = () => {
  const [step, setStep] = useState<Step>("start");

  // Session binding — kept in memory ONLY (never localStorage, never the URL).
  const [session, setSession] = useState<RecoverySession | null>(null);
  const [contactMethod, setContactMethod] =
    useState<RecoveryContactMethod>("email");
  const [maskedDestination, setMaskedDestination] = useState("");

  // Step inputs. The code the user types is held only transiently to submit it;
  // the server's code is never exposed to the client.
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [caseId, setCaseId] = useState("");

  const [enrollment, setEnrollment] = useState<RecoveryReenrollResult | null>(
    null,
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [appealFile, setAppealFile] = useState<File | null>(null);

  const start = useRecoveryStart();
  const verify = useRecoveryVerifyCode();
  const resend = useRecoveryResend();
  const reenroll = useRecoveryReenroll();
  const complete = useRecoveryComplete();
  const uploadDoc = useRecoveryUploadDocument();
  const appeal = useRecoveryAppeal();

  const appealForm = useForm<AppealValues>({
    resolver: zodResolver(appealSchema),
    defaultValues: { contact: "" },
  });

  const goBlocked = () => {
    setStep("blocked");
    setCode("");
  };

  /* ---- Step 1: submit contact ---- */
  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await start.mutateAsync(contact);
      setSession({ recoveryId: res.recoveryId, sessionToken: res.sessionToken });
      setContactMethod(res.contactMethod);
      setMaskedDestination(res.maskedDestination);
      // Pre-fill the appeal contact with what they typed (not the masked value).
      appealForm.setValue("contact", contact.trim());
      setStep("verify");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  /* ---- Step 2: verify code → stage re-enrollment ---- */
  const beginReenroll = async (sess: RecoverySession) => {
    try {
      const res = await reenroll.mutateAsync(sess);
      setEnrollment(res);
      if (res.otpauthUrl) {
        try {
          setQrDataUrl(await QrCode.toDataURL(res.otpauthUrl));
        } catch {
          setQrDataUrl(null);
        }
      }
    } catch (err) {
      // The reenroll step renders a retry when `enrollment` is still null.
      toast.error(apiErrorMessage(err));
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      await verify.mutateAsync({ ...session, code: code.trim() });
    } catch (err) {
      if (statusOf(err) === 423) {
        goBlocked();
        return;
      }
      toast.error(apiErrorMessage(err));
      setCode("");
      return;
    }
    // Identity confirmed (the one-time code is now consumed server-side). Move
    // forward and stage the new secret; staging is retryable on the next step
    // so a transient failure here never strands the user on a used code.
    setStep("reenroll");
    void beginReenroll(session);
  };

  const onResend = async () => {
    if (!session) return;
    try {
      await resend.mutateAsync(session);
      toast.success("If your account qualifies, a new code is on its way.");
      setCode("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  /* ---- Step 3: confirm the new authenticator ---- */
  const copySecret = () => {
    if (!enrollment?.secret) return;
    navigator.clipboard.writeText(enrollment.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      await complete.mutateAsync({ ...session, code: newCode.trim() });
      // Burn local references to the recovery session on success.
      setSession(null);
      setEnrollment(null);
      setQrDataUrl(null);
      setNewCode("");
      setStep("done");
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setNewCode("");
    }
  };

  /* ---- Appeal path ---- */
  const onAppeal = appealForm.handleSubmit(async (values) => {
    try {
      let documentUrl: string | undefined;
      if (appealFile) {
        if (!session) {
          toast.error(
            "Start recovery again before attaching a document to your appeal.",
          );
          return;
        }
        const up = await uploadDoc.mutateAsync({ ...session, file: appealFile });
        documentUrl = up.url;
      }
      const res = await appeal.mutateAsync({
        recoveryId: session?.recoveryId,
        sessionToken: session?.sessionToken,
        fullName: values.fullName,
        contact: values.contact,
        reason: values.reason,
        explanation: values.explanation || undefined,
        documentUrl,
      });
      setCaseId(res.caseId);
      setStep("appeal_submitted");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  });

  /* ------------------------------------------------------------------ */
  /* Rendering                                                           */
  /* ------------------------------------------------------------------ */

  const backToLogin = (
    <Link to="/login" className="font-semibold text-primary hover:underline">
      Back to sign in
    </Link>
  );

  if (step === "start") {
    return (
      <AuthLayout
        title="Recover your authenticator"
        subtitle="Lost access to your authenticator app? Enter the email address or phone number on your account and we'll send a verification code to confirm it's you."
        footer={backToLogin}
      >
        <form onSubmit={onStart} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rc-contact">Email or phone number</Label>
            <Input
              id="rc-contact"
              autoComplete="username"
              placeholder="you@example.com or 0803..."
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={start.isPending || contact.trim().length < 3}
            className="h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
          >
            {start.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Send verification code"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            For your security we never reveal whether an account exists. If your
            details match, a code will be sent.
          </p>
        </form>
      </AuthLayout>
    );
  }

  if (step === "verify") {
    return (
      <AuthLayout
        title="Enter your verification code"
        subtitle={`If your details match an account, we've sent a 6-digit code to ${maskedDestination}. It expires shortly.`}
        footer={
          <button
            type="button"
            onClick={() => setStep("appeal")}
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Can't access this {contactMethod === "phone" ? "number" : "inbox"}?
            Submit an appeal
          </button>
        }
      >
        <form onSubmit={onVerify} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rc-code">6-digit code</Label>
            <Input
              id="rc-code"
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
            disabled={verify.isPending || reenroll.isPending || code.length < 6}
            className="h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
          >
            {verify.isPending || reenroll.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Verify"
            )}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={onResend}
              disabled={resend.isPending}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resend.isPending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  if (step === "reenroll") {
    return (
      <AuthLayout
        title="Set up your new authenticator"
        subtitle="Scan the QR code (or enter the key) in your authenticator app, then enter a fresh 6-digit code to finish. Your old authenticator will stop working."
        footer={backToLogin}
      >
        {!enrollment ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            {reenroll.isPending ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Preparing your new authenticator…
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  We couldn&apos;t prepare your new authenticator. Please try
                  again.
                </p>
                <Button
                  type="button"
                  onClick={() => session && beginReenroll(session)}
                  disabled={!session}
                  className="h-11 rounded-full bg-gradient-primary px-6 font-semibold shadow-glow"
                >
                  Try again
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Scan this QR code with your authenticator app"
                className="mx-auto h-44 w-44 rounded-xl border bg-white p-2"
              />
            )}
            {enrollment.secret && (
              <div className="rounded-xl bg-muted p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Manual setup key</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copySecret}
                    className="h-7 px-2"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="mt-1 break-all font-mono">{enrollment.secret}</p>
              </div>
            )}
            <form onSubmit={onComplete} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rc-newcode">
                  Enter the 6-digit code from your new app
                </Label>
                <Input
                  id="rc-newcode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button
                type="submit"
                disabled={complete.isPending || newCode.length < 6}
                className="h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
              >
                {complete.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Finish and restore access"
                )}
              </Button>
            </form>
          </div>
        )}
      </AuthLayout>
    );
  }

  if (step === "done") {
    return (
      <AuthLayout
        title="Authenticator restored"
        subtitle="Your new authenticator is now active and your old one has been revoked."
        footer={backToLogin}
      >
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>All set</AlertTitle>
          <AlertDescription>
            For your security, all existing sessions were signed out. Please sign
            in again with your password and a code from your new authenticator.
          </AlertDescription>
        </Alert>
        <Button
          asChild
          className="mt-4 h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
        >
          <Link to="/login">Go to sign in</Link>
        </Button>
      </AuthLayout>
    );
  }

  if (step === "blocked") {
    return (
      <AuthLayout
        title="Recovery temporarily locked"
        subtitle="For your security, automated recovery for this account is paused for a while after too many attempts."
        footer={backToLogin}
      >
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Too many attempts</AlertTitle>
          <AlertDescription>
            You can wait and try again later, or submit an appeal to our security
            team to regain access to your account.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => setStep("appeal")}
          className="mt-4 h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
        >
          <LifeBuoy className="mr-2 h-4 w-4" />
          Submit an appeal
        </Button>
      </AuthLayout>
    );
  }

  if (step === "appeal") {
    return (
      <AuthLayout
        title="Submit a recovery appeal"
        subtitle="Our security team will review your request and contact you at the details you provide. Please upload a government-issued ID if you have one — it helps us verify your identity."
        footer={
          <button
            type="button"
            onClick={() => setStep(session ? "verify" : "start")}
            className="font-semibold text-primary hover:underline"
          >
            Back
          </button>
        }
      >
        <form onSubmit={onAppeal} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ap-name">Full name</Label>
            <Input id="ap-name" {...appealForm.register("fullName")} />
            {appealForm.formState.errors.fullName && (
              <p className="text-xs text-destructive">
                {appealForm.formState.errors.fullName.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-contact">
              Email or phone number on the account
            </Label>
            <Input id="ap-contact" {...appealForm.register("contact")} />
            {appealForm.formState.errors.contact && (
              <p className="text-xs text-destructive">
                {appealForm.formState.errors.contact.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-reason">What happened?</Label>
            <Textarea
              id="ap-reason"
              rows={3}
              placeholder="e.g. I lost my phone and no longer have my authenticator app."
              {...appealForm.register("reason")}
            />
            {appealForm.formState.errors.reason && (
              <p className="text-xs text-destructive">
                {appealForm.formState.errors.reason.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-explanation">
              Anything else? <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="ap-explanation"
              rows={2}
              {...appealForm.register("explanation")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-doc">
              Identity document{" "}
              <span className="text-muted-foreground">
                (optional, JPG/PNG/PDF)
              </span>
            </Label>
            <Input
              id="ap-doc"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setAppealFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Your document is stored privately and is only ever visible to our
              security reviewers — never shared or sent by email.
            </p>
          </div>
          <Button
            type="submit"
            disabled={appeal.isPending || uploadDoc.isPending}
            className="h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
          >
            {appeal.isPending || uploadDoc.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit appeal"
            )}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  // step === "appeal_submitted"
  return (
    <AuthLayout
      title="Appeal received"
      subtitle="Thank you. Our security team will review your appeal and contact you at the details you provided."
      footer={backToLogin}
    >
      <Alert>
        <LifeBuoy className="h-4 w-4" />
        <AlertTitle>Your case reference</AlertTitle>
        <AlertDescription>
          <span className="font-mono text-base font-semibold text-foreground">
            {caseId}
          </span>
          <br />
          Keep this reference for your records. We&apos;ll use it when we follow
          up with you.
        </AlertDescription>
      </Alert>
    </AuthLayout>
  );
};

export default Recovery;
