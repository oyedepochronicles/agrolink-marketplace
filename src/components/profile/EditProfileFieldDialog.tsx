import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiErrorMessage } from "@/lib/api";
import { Loader2, Mail, Phone, ShieldCheck, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type FieldKey = "name" | "email" | "phone";

const SENSITIVE: FieldKey[] = ["email", "phone"];

const schema = {
  name: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Invalid phone").max(20),
};

interface Props {
  field: FieldKey;
  trigger: React.ReactNode;
}

const LABELS: Record<FieldKey, { label: string; icon: typeof UserIcon }> = {
  name: { label: "Display name", icon: UserIcon },
  email: { label: "Email address", icon: Mail },
  phone: { label: "Phone number", icon: Phone },
};

export const EditProfileFieldDialog = ({ field, trigger }: Props) => {
  const { user, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [busy, setBusy] = useState(false);
  const [requested, setRequested] = useState(false);

  const isSensitive = SENSITIVE.includes(field);
  const { label, icon: Icon } = LABELS[field];

  useEffect(() => {
    if (!open) return;
    setValue((user?.[field] as string) ?? "");
    setOtp("");
    setStep("input");
    setRequested(false);
  }, [open, user, field]);

  const validate = () => {
    const r = schema[field].safeParse(value);
    if (!r.success) {
      toast.error(r.error.issues[0].message);
      return false;
    }
    return true;
  };

  const saveNonSensitive = async () => {
    setBusy(true);
    try {
      await api.patch("/users/me", { [field]: value });
      await refresh();
      toast.success(`${label} updated`);
      setOpen(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const requestOtp = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      // Tries standard endpoint; backend should send OTP to the new email/phone.
      await api.post("/users/me/request-change-otp", { field, value });
      setRequested(true);
      setStep("otp");
      toast.success(`OTP sent to your new ${field}`);
    } catch (e) {
      // Fallback to common alt endpoint
      try {
        await api.post("/auth/send-otp", { type: field, value });
        setRequested(true);
        setStep("otp");
        toast.success(`OTP sent to your new ${field}`);
      } catch {
        toast.error(apiErrorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    try {
      await api.post("/users/me/confirm-change", { field, value, otp });
      await refresh();
      toast.success(`${label} updated`);
      setOpen(false);
    } catch (e) {
      // Fallback path
      try {
        await api.patch("/users/me", { [field]: value, otp });
        await refresh();
        toast.success(`${label} updated`);
        setOpen(false);
      } catch {
        toast.error(apiErrorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="inline-flex">
        {trigger}
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" /> Update {label.toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            {isSensitive
              ? "We'll send a 6-digit code to verify the new value."
              : "Enter the new value and save."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-3">
            <Label htmlFor="edit-value">New {label.toLowerCase()}</Label>
            <Input
              id="edit-value"
              type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
              autoComplete={field}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter new ${label.toLowerCase()}`}
            />
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-3">
            <Label>Verification code</Label>
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
            <p className="text-xs text-muted-foreground">
              We sent a code to <span className="font-semibold">{value}</span>.
              {" "}
              <button
                type="button"
                onClick={requestOtp}
                className="font-semibold text-primary hover:underline"
                disabled={busy}
              >
                Resend
              </button>
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          {step === "input" ? (
            <Button
              onClick={isSensitive ? requestOtp : saveNonSensitive}
              disabled={busy || !value.trim() || value === (user?.[field] as string)}
              className="rounded-full bg-gradient-primary"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSensitive ? "Send code" : "Save"}
            </Button>
          ) : (
            <Button
              onClick={confirmOtp}
              disabled={busy || otp.length !== 6}
              className="rounded-full bg-gradient-primary"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Verify & save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
