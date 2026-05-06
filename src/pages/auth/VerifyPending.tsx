import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, FileWarning, Loader2, ShieldCheck, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile } from "@/hooks/useChat";
import { useSubmitVerification } from "@/hooks/useProfile";
import { apiErrorMessage } from "@/lib/api";
import { Brand } from "@/components/Brand";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const DOC_TYPES = [
  { value: "nin", label: "National ID (NIN)" },
  { value: "passport", label: "International Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "business_doc", label: "Business / CAC Document" },
];

const VerifyPending = () => {
  const { user, logout, refresh } = useAuth();
  const { t } = useTranslation();
  const submit = useSubmitVerification();

  const [docType, setDocType] = useState("nin");
  const [docNumber, setDocNumber] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState<"doc" | "selfie" | null>(null);

  if (!user) return <Navigate to="/login" replace />;

  const status = user.verificationStatus;
  const isVerified = user.isVerified === true || status === "approved";
  if (isVerified) return <Navigate to={`/dashboard/${user.role === "super_admin" ? "admin" : user.role}`} replace />;

  const handleUpload = async (file: File | undefined, kind: "doc" | "selfie") => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max file size is 10MB"); return; }
    setUploading(kind);
    try {
      const url = await uploadFile(file, file.name);
      if (!url) throw new Error("Upload failed");
      if (kind === "doc") { setDocUrl(url); setDocName(file.name); }
      else setSelfieUrl(url);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setUploading(null); }
  };

  const onSubmit = async () => {
    if (!docUrl) { toast.error(t("verify.uploadHint")); return; }
    try {
      await submit.mutateAsync({
        documentType: docType,
        documentNumber: docNumber || undefined,
        documentUrl: docUrl,
        selfieUrl: selfieUrl || undefined,
        note: note || undefined,
      });
      toast.success(t("verify.submittedTitle"));
      await refresh();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  // Already submitted (pending review)
  if (status === "pending") {
    return (
      <Shell>
        <Card className="rounded-2xl border-warning/30 bg-warning/5 p-6 text-center shadow-card">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
            <Clock className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-extrabold">{t("verify.submittedTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("verify.submittedDesc")}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild className="rounded-full"><Link to="/marketplace">{t("verify.browseMarketplace")}</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/marketplace/support">{t("verify.contactSupport")}</Link></Button>
          </div>
        </Card>
      </Shell>
    );
  }

  // Rejected — let them resubmit
  const isRejected = status === "rejected";

  return (
    <Shell>
      <Card className="rounded-2xl p-6 shadow-card">
        <div className="mb-5 flex items-start gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isRejected ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {isRejected ? <XCircle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold">
              {isRejected ? t("verify.rejectedTitle") : t("verify.submitTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRejected ? t("verify.rejectedDesc") : t("verify.submitSubtitle")}
            </p>
          </div>
        </div>

        {isRejected && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t("verify.rejectedDesc")}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("verify.documentType")}</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="docNumber">{t("verify.documentNumber")}</Label>
            <Input id="docNumber" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} maxLength={50} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("verify.documentUpload")}</Label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 hover:border-primary">
              <span className="truncate text-sm text-muted-foreground">{docName || t("verify.uploadHint")}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                {uploading === "doc" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {docUrl ? t("common.edit") : t("nav.getStarted")}
              </span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], "doc")} />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>{t("verify.selfie")}</Label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 hover:border-primary">
              <span className="truncate text-sm text-muted-foreground">{selfieUrl ? t("verify.selfieUploaded") : t("verify.selfieHint")}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                {uploading === "selfie" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {selfieUrl ? t("common.edit") : t("nav.getStarted")}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], "selfie")} />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">{t("verify.note")}</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" asChild className="text-muted-foreground">
            <Link to="/marketplace"><CheckCircle2 className="mr-2 h-4 w-4" />{t("verify.browseMarketplace")}</Link>
          </Button>
          <Button onClick={onSubmit} disabled={submit.isPending || !docUrl} className="rounded-full bg-gradient-primary shadow-glow">
            {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t("verify.submitForReview")}
          </Button>
        </div>
      </Card>
    </Shell>
  );

  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <Brand />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" onClick={() => { logout(); }}>{t("nav.signOut")}</Button>
            </div>
          </div>
        </header>
        <main className="container max-w-2xl py-10">{children}</main>
      </div>
    );
  }
};

export default VerifyPending;
