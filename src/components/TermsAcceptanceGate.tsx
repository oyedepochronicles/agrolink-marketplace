import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAcceptTerms, useMyPendingTerms } from "@/hooks/useMyTerms";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Loader2, ScrollText } from "lucide-react";
import { toast } from "sonner";

/**
 * Global, blocking Terms & Conditions acceptance gate.
 *
 * Mounted once inside <AuthProvider>. When the signed-in user has any pending
 * (active, acceptance-required, not-yet-accepted) terms for their audience, a
 * non-dismissible dialog presents them one at a time; the user must Accept each
 * or Sign out. It is deliberately NOT a trap — signing out is always available —
 * and it fails OPEN: if the pending list can't be fetched the gate simply doesn't
 * block (real consent is enforced server-side on every protected operation). The
 * full legal text is shown so the user can read exactly what they agree to, and
 * acceptance is recorded against the precise version.
 */
export const TermsAcceptanceGate = () => {
  const { user, logout } = useAuth();
  const { data: pending = [] } = useMyPendingTerms(!!user);
  const acceptTerms = useAcceptTerms();

  const current = pending[0];
  const open = !!user && !!current;
  // Escape/outside-click are already suppressed; guard render too.
  if (!open) return null;

  const accept = async () => {
    try {
      await acceptTerms.mutateAsync(current._id);
      // The pending list refetches on success; when it empties the gate closes.
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const remaining = pending.length;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className="max-w-2xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 shrink-0 text-primary" />
            {current.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {current.summary || "Please review and accept the updated terms to continue."}
            {" · "}Version {current.version}
            {current.effectiveFrom ? ` · Effective ${formatDate(current.effectiveFrom)}` : ""}
            {remaining > 1 ? ` · ${remaining} documents to review` : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-secondary/30 p-4 text-sm leading-relaxed">
          {current.content}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => logout()}
            disabled={acceptTerms.isPending}
          >
            Sign out
          </Button>
          <Button className="rounded-full" onClick={accept} disabled={acceptTerms.isPending}>
            {acceptTerms.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Accept and continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TermsAcceptanceGate;
