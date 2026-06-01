import { AuthLayout } from "@/components/auth/AuthLayout";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import { useRegisterExportPartner } from "@/hooks/useExports";
import { apiErrorMessage } from "@/lib/api";
import { Globe2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ExportPartnerRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useRegisterExportPartner();
  const [f, setF] = useState({
    companyName: "",
    cacRegistrationNumber: "",
    exportLicenseNumber: "",
    contactPerson: "",
    companyEmail: "",
    phone: "",
    companyAddress: "",
    password: "",
    website: "",
    companyLogo: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register.mutateAsync(f);
      toast.success(t("exports.partnerSubmitted"));
      navigate("/login");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      title={t("exports.partnerJoinTitle")}
      subtitle={t("exports.partnerJoinSub")}
      footer={
        <>
          {t("auth.alreadyHaveAccount")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("nav.signIn")}
          </Link>
        </>
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Globe2 className="h-3 w-3" /> {t("exports.exportPartner")}
        </span>
        <LanguageSwitcher compact={false} />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Row>
          <Field label={t("exports.companyName")} value={f.companyName} onChange={(v) => setF({ ...f, companyName: v })} />
          <Field label={t("exports.contactPerson")} value={f.contactPerson} onChange={(v) => setF({ ...f, contactPerson: v })} />
        </Row>
        <Row>
          <Field label={t("exports.cac")} value={f.cacRegistrationNumber} onChange={(v) => setF({ ...f, cacRegistrationNumber: v })} />
          <Field label={t("exports.exportLicense")} value={f.exportLicenseNumber} onChange={(v) => setF({ ...f, exportLicenseNumber: v })} />
        </Row>
        <Row>
          <Field type="email" label={t("exports.companyEmail")} value={f.companyEmail} onChange={(v) => setF({ ...f, companyEmail: v })} />
          <Field label={t("auth.phone")} value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
        </Row>
        <div>
          <Label>{t("exports.companyAddress")}</Label>
          <Textarea value={f.companyAddress} onChange={(e) => setF({ ...f, companyAddress: e.target.value })} />
        </div>
        <Row>
          <Field label={t("exports.website")} value={f.website} onChange={(v) => setF({ ...f, website: v })} />
          <Field label={t("exports.logoUrl")} value={f.companyLogo} onChange={(v) => setF({ ...f, companyLogo: v })} />
        </Row>
        <div>
          <Label>{t("auth.password")}</Label>
          <PasswordInput value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </div>
        <Button type="submit" disabled={register.isPending}
          className="h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow">
          {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("exports.submitPartnerApp")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t("exports.partnerNotice")}</p>
      </form>
    </AuthLayout>
  );
};

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 md:grid-cols-2">{children}</div>
);

const Field = ({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export default ExportPartnerRegister;
