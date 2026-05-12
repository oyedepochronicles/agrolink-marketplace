import { AuthLayout } from "@/components/auth/AuthLayout";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(6, "At least 6 characters").max(128),
});
type FormValues = z.infer<typeof schema>;

const Register = () => {
  const { registerBuyer } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { from?: { pathname?: string; search?: string } };
  };
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const user = await registerBuyer({
        ...(values as Required<FormValues>),
        phone: values.phone || undefined,
      });
      toast.success(`Welcome, ${user.name.split(" ")[0]}!`);
      const from = location.state?.from
        ? `${location.state.from.pathname ?? ""}${location.state.from.search ?? ""}`
        : undefined;
      navigate(from ?? "/marketplace", { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.createBuyerAccount")}
      subtitle={t("auth.buyerSubtitle")}
      footer={
        <>
          {t("auth.alreadyHaveAccount")}{" "}
          <Link
            to="/login"
            state={location.state}
            className="font-semibold text-primary hover:underline"
          >
            {t("nav.signIn")}
          </Link>
        </>
      }
    >
      <div className="mb-3 flex justify-end">
        <LanguageSwitcher compact={false} />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("auth.fullName")}</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jane Doe"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
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
            <Label htmlFor="phone">{t("auth.phoneOptional")}</Label>
            <Input
              id="phone"
              autoComplete="tel"
              placeholder="080..."
              {...register("phone")}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={t("auth.passwordHint")}
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
            t("auth.createAccount")
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("auth.termsNotice")}
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
