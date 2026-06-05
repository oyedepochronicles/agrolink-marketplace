import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmailVerificationStatus,
  useResendEmailVerification,
} from "@/hooks/useEmailVerification";
import { MailCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Non-blocking soft email-verification reminder.
 * Never prevents the user from using the app.
 */
export const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const { data } = useEmailVerificationStatus();
  const resend = useResendEmailVerification();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("phyhan.email-banner.dismissed") === "1",
  );

  if (!user || dismissed) return null;
  // Treat missing endpoint or already-verified user as "no banner".
  const verified =
    data?.emailVerified ??
    (user as { emailVerified?: boolean }).emailVerified ??
    true;
  if (verified) return null;

  const close = () => {
    sessionStorage.setItem("phyhan.email-banner.dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          Verify your email to receive updates{" "}
          <span className="text-muted-foreground">(optional)</span>
        </p>
        <p className="text-xs text-muted-foreground">
          You'll keep full access — verification only unlocks email
          notifications and seller upgrades.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full"
        disabled={resend.isPending}
        onClick={() =>
          resend.mutate(undefined, {
            onSuccess: () => toast.success("Verification email sent"),
            onError: () => toast.error("Couldn't send verification email"),
          })
        }
      >
        {resend.isPending ? "Sending…" : "Resend"}
      </Button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={close}
        className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
