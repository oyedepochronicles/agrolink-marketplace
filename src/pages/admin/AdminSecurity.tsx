import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDisableMfa,
  useEnableMfa,
  useSetupMfa,
  type MfaSetupResponse,
} from "@/hooks/useSecurity";
import { apiErrorMessage } from "@/lib/api";
import { Check, Copy, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import QrCode from "qrcode";
import { useState } from "react";
import { toast } from "sonner";

const AdminSecurity = () => {
  const { user } = useAuth();
  const setup = useSetupMfa();
  const enable = useEnableMfa();
  const disable = useDisableMfa();
  const [enrollment, setEnrollment] = useState<MfaSetupResponse | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [copied, setCopied] = useState(false);

  const copySecret = () => {
    if (enrollment?.secret) {
      navigator.clipboard.writeText(enrollment.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const enabled = user?.mfaEnabled === true;

  const startSetup = async () => {
    try {
      const setupResponse = await setup.mutateAsync();
      if (setupResponse.otpauthUrl) {
        const qrCodeDataUrl = await QrCode.toDataURL(setupResponse.otpauthUrl);
        setQrCodeDataUrl(qrCodeDataUrl);
      }
      setEnrollment(setupResponse);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const confirm = async () => {
    try {
      await enable.mutateAsync(code.trim());
      toast.success("Two-factor authentication enabled");
      setEnrollment(null);
      setCode("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const turnOff = async () => {
    try {
      await disable.mutateAsync(disableCode.trim());
      toast.success("Two-factor authentication disabled");
      setDisableCode("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & MFA"
        description="Multi-factor authentication is mandatory for every administrator account."
      />

      {!enabled && (
        <Alert variant="destructive">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Two-factor authentication is required</AlertTitle>
          <AlertDescription>
            Set up an authenticator app to unlock the rest of the admin console.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Authenticator app</CardTitle>
              <CardDescription>
                Time-based one-time codes (TOTP).
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={
                enabled
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }
            >
              {enabled ? "Enabled" : "Not enabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!enabled && !enrollment && (
            <Button
              onClick={startSetup}
              disabled={setup.isPending}
              className="rounded-full"
            >
              {setup.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Start setup
            </Button>
          )}

          {enrollment && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {enrollment.message}
              </p>

              {enrollment.secret && (
                <img
                  src={qrCodeDataUrl}
                  alt="Scan this QR code with your authenticator app"
                  className="h-44 w-44 rounded-xl border bg-white p-2"
                />
              )}
              {enrollment.secret && (
                <div
                  className="rounded-xl bg-muted p-3 text-sm"
                  onClick={copySecret}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Manual setup key
                    </p>

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

                  <p className="mt-1 break-all font-mono">
                    {enrollment.secret}
                  </p>
                </div>
              )}
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="mfa-confirm">Enter the 6-digit code</Label>
                <Input
                  id="mfa-confirm"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                />
              </div>
              <Button
                onClick={confirm}
                disabled={code.length < 6 || enable.isPending}
                className="rounded-full"
              >
                {enable.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm and enable
              </Button>
            </div>
          )}

          {enabled && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter a current code to turn off two-factor authentication.
                Admin accounts without MFA lose console access until it is
                re-enabled.
              </p>
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="mfa-disable">Authentication code</Label>
                <Input
                  id="mfa-disable"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) =>
                    setDisableCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                />
              </div>
              <Button
                variant="outline"
                onClick={turnOff}
                disabled={disableCode.length < 6 || disable.isPending}
                className="rounded-full"
              >
                {disable.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Disable MFA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurity;
