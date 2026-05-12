import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { api, apiErrorMessage } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  otp: z.string().length(6, "Enter the 6-digit code"),
});

type FormValues = z.infer<typeof schema>;

const VerifyOTP = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const defaultEmail = params.get("email") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: defaultEmail,
      otp: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/verify-otp", {
        ...values,
        otp: otpValue,
      });
      const token = data?.token;
      if (!token) {
        toast.error("Unable to verify OTP. Please try again.");
        return;
      }
      toast.success("OTP verified. Set your new password.");
      navigate(`/reset-password?token=${encodeURIComponent(token)}`, {
        replace: true,
      });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Verify reset code"
      subtitle="Enter the one-time password sent to your email."
      footer={
        <Link
          to="/login"
          className="font-semibold text-primary hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <Label htmlFor="otp">Verification code</Label>
          <InputOTP
            value={otpValue}
            onChange={(value) => {
              setOtpValue(value);
              setValue("otp", value);
            }}
            maxLength={6}
            inputMode="numeric"
            pattern={REGEXP_ONLY_DIGITS}
            className="w-full"
          >
            <InputOTPGroup className="justify-center gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {errors.otp && (
            <p className="text-xs text-destructive">{errors.otp.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Check your inbox for a 6-digit code. If you didn&apos;t receive it,
            request a new one.
          </p>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-full bg-gradient-primary shadow-glow"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Verify code"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have a reset code?{" "}
          <Link
            to="/verify-otp"
            className="font-semibold text-primary hover:underline"
          >
            Verify it here
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the email?{" "}
          <Link
            to="/forgot-password"
            className="font-semibold text-primary hover:underline"
          >
            Request a new code
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default VerifyOTP;
