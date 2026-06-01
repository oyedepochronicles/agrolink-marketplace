import { MarketplaceNavbar } from "@/components/marketplace/MarketplaceNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  useApplyToExportRequest,
  useExportRequest,
} from "@/hooks/useExports";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Globe2,
  Loader2,
  MapPin,
  Package,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const ExportDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: req, isLoading } = useExportRequest(id);
  const apply = useApplyToExportRequest();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    quantityAvailable: "",
    proposedPrice: "",
    currency: "NGN",
    harvestDetails: "",
    qualityNotes: "",
    packagingReadiness: "ready",
  });

  const canApply = user?.role === "farmer";

  const submit = async () => {
    if (!id) return;
    try {
      await apply.mutateAsync({
        id,
        quantityAvailable: Number(form.quantityAvailable),
        proposedPrice: Number(form.proposedPrice),
        currency: form.currency,
        harvestDetails: form.harvestDetails,
        qualityNotes: form.qualityNotes || undefined,
        packagingReadiness: form.packagingReadiness,
      });
      toast.success(t("exports.appliedToast"));
      setOpen(false);
      navigate("/dashboard/farmer/exports");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      <div className="container py-8">
        <Button asChild variant="ghost" className="mb-4 -ml-2">
          <Link to="/exports">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("exports.backToList")}
          </Link>
        </Button>

        {isLoading || !req ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Card className="rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                    {req.destinationCountry}
                  </Badge>
                  <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                    {req.productName}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {req.partnerId?.companyName || req.partnerId?.name}
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{req.status}</Badge>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field icon={<Package className="h-4 w-4" />} label={t("exports.quantity")}
                  value={`${req.quantityRequired.toLocaleString()} ${req.unit ?? ""}`} />
                <Field icon={<MapPin className="h-4 w-4" />} label={t("exports.pickup")}
                  value={req.pickupLocation} />
                <Field icon={<Calendar className="h-4 w-4" />} label={t("exports.deadline")}
                  value={formatDate(req.applicationDeadline)} />
                <Field icon={<Globe2 className="h-4 w-4" />} label={t("exports.priceRange")}
                  value={req.priceRange?.min ? `${req.priceRange.currency ?? "NGN"} ${req.priceRange.min} – ${req.priceRange.max ?? ""}` : "—"} />
              </div>

              <Section title={t("exports.quality")} body={req.qualityRequirements} />
              <Section title={t("exports.packaging")} body={req.packagingRequirements} />
              {req.additionalNotes && (
                <Section title={t("exports.notes")} body={req.additionalNotes} />
              )}

              {req.documents && req.documents.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold">{t("exports.documents")}</p>
                  <ul className="space-y-2">
                    {req.documents.map((d) => (
                      <li key={d.url}>
                        <a href={d.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm hover:border-primary/50">
                          <FileText className="h-4 w-4 text-primary" /> {d.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card className="h-fit rounded-2xl p-6">
              <p className="text-sm text-muted-foreground">{t("exports.applyCardTitle")}</p>
              <h3 className="font-display text-lg font-bold">{t("exports.applyCardSub")}</h3>
              <ul className="my-4 space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> {t("exports.bullet1")}</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> {t("exports.bullet2")}</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> {t("exports.bullet3")}</li>
              </ul>
              {!user ? (
                <Button asChild className="w-full rounded-full bg-gradient-primary">
                  <Link to="/login">{t("exports.signInToApply")}</Link>
                </Button>
              ) : canApply ? (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-full bg-gradient-primary">
                      {t("exports.applyNow")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{t("exports.applyTitle")}</DialogTitle></DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>{t("exports.quantityAvailable")}</Label>
                          <Input type="number" value={form.quantityAvailable}
                            onChange={(e) => setForm({ ...form, quantityAvailable: e.target.value })} />
                        </div>
                        <div>
                          <Label>{t("exports.proposedPrice")}</Label>
                          <Input type="number" value={form.proposedPrice}
                            onChange={(e) => setForm({ ...form, proposedPrice: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <Label>{t("exports.harvestDetails")}</Label>
                        <Textarea value={form.harvestDetails}
                          onChange={(e) => setForm({ ...form, harvestDetails: e.target.value })} />
                      </div>
                      <div>
                        <Label>{t("exports.qualityNotes")}</Label>
                        <Textarea value={form.qualityNotes}
                          onChange={(e) => setForm({ ...form, qualityNotes: e.target.value })} />
                      </div>
                      <div>
                        <Label>{t("exports.packagingReadiness")}</Label>
                        <Input value={form.packagingReadiness}
                          onChange={(e) => setForm({ ...form, packagingReadiness: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                      <Button onClick={submit} disabled={apply.isPending}
                        className="bg-gradient-primary">
                        {apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("exports.submitApplication")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <p className="rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">
                  {t("exports.onlyFarmers")}
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-secondary/30 p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
    <p className="mt-1 text-sm font-semibold">{value}</p>
  </div>
);

const Section = ({ title, body }: { title: string; body: string }) => (
  <div className="mt-6">
    <p className="mb-1 text-sm font-semibold">{title}</p>
    <p className="whitespace-pre-line text-sm text-muted-foreground">{body}</p>
  </div>
);

export default ExportDetails;
