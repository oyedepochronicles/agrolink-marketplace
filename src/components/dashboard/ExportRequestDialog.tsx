import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateExportRequest,
  useUpdateExportRequest,
} from "@/hooks/useExports";
import { apiErrorMessage } from "@/lib/api";
import type { ExportRequest } from "@/types/exports";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing?: ExportRequest | null;
}

export const ExportRequestDialog = ({ open, onOpenChange, existing }: Props) => {
  const { t } = useTranslation();
  const create = useCreateExportRequest();
  const update = useUpdateExportRequest();

  const [f, setF] = useState({
    productName: "",
    quantityRequired: "",
    unit: "kg",
    qualityRequirements: "",
    packagingRequirements: "",
    destinationCountry: "",
    priceMin: "",
    priceMax: "",
    currency: "NGN",
    applicationDeadline: "",
    pickupLocation: "",
    additionalNotes: "",
  });

  useEffect(() => {
    if (existing) {
      setF({
        productName: existing.productName,
        quantityRequired: String(existing.quantityRequired),
        unit: existing.unit ?? "kg",
        qualityRequirements: existing.qualityRequirements,
        packagingRequirements: existing.packagingRequirements,
        destinationCountry: existing.destinationCountry,
        priceMin: String(existing.priceRange?.min ?? ""),
        priceMax: String(existing.priceRange?.max ?? ""),
        currency: existing.priceRange?.currency ?? "NGN",
        applicationDeadline: existing.applicationDeadline?.slice(0, 10) ?? "",
        pickupLocation: existing.pickupLocation,
        additionalNotes: existing.additionalNotes ?? "",
      });
    } else {
      setF({
        productName: "", quantityRequired: "", unit: "kg",
        qualityRequirements: "", packagingRequirements: "",
        destinationCountry: "", priceMin: "", priceMax: "",
        currency: "NGN", applicationDeadline: "",
        pickupLocation: "", additionalNotes: "",
      });
    }
  }, [existing, open]);

  const submit = async () => {
    const body = {
      productName: f.productName,
      quantityRequired: Number(f.quantityRequired),
      unit: f.unit,
      qualityRequirements: f.qualityRequirements,
      packagingRequirements: f.packagingRequirements,
      destinationCountry: f.destinationCountry,
      priceRange: {
        min: f.priceMin ? Number(f.priceMin) : undefined,
        max: f.priceMax ? Number(f.priceMax) : undefined,
        currency: f.currency,
      },
      applicationDeadline: f.applicationDeadline
        ? new Date(f.applicationDeadline).toISOString()
        : undefined,
      pickupLocation: f.pickupLocation,
      additionalNotes: f.additionalNotes || undefined,
    };
    try {
      if (existing) {
        await update.mutateAsync({ id: existing._id, patch: body });
        toast.success(t("exports.requestUpdated"));
      } else {
        await create.mutateAsync(body);
        toast.success(t("exports.requestCreated"));
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existing ? t("exports.editRequest") : t("exports.newRequest")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
          <div className="grid gap-3 md:grid-cols-2">
            <FieldT label={t("exports.productName")} value={f.productName}
              onChange={(v) => setF({ ...f, productName: v })} />
            <FieldT label={t("exports.destination")} value={f.destinationCountry}
              onChange={(v) => setF({ ...f, destinationCountry: v })} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <FieldT type="number" label={t("exports.quantity")} value={f.quantityRequired}
              onChange={(v) => setF({ ...f, quantityRequired: v })} />
            <FieldT label={t("exports.unit")} value={f.unit}
              onChange={(v) => setF({ ...f, unit: v })} />
            <FieldT type="date" label={t("exports.deadline")} value={f.applicationDeadline}
              onChange={(v) => setF({ ...f, applicationDeadline: v })} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <FieldT type="number" label={t("exports.priceMin")} value={f.priceMin}
              onChange={(v) => setF({ ...f, priceMin: v })} />
            <FieldT type="number" label={t("exports.priceMax")} value={f.priceMax}
              onChange={(v) => setF({ ...f, priceMax: v })} />
            <FieldT label={t("exports.currency")} value={f.currency}
              onChange={(v) => setF({ ...f, currency: v })} />
          </div>
          <FieldT label={t("exports.pickup")} value={f.pickupLocation}
            onChange={(v) => setF({ ...f, pickupLocation: v })} />
          <div>
            <Label>{t("exports.quality")}</Label>
            <Textarea value={f.qualityRequirements}
              onChange={(e) => setF({ ...f, qualityRequirements: e.target.value })} />
          </div>
          <div>
            <Label>{t("exports.packaging")}</Label>
            <Textarea value={f.packagingRequirements}
              onChange={(e) => setF({ ...f, packagingRequirements: e.target.value })} />
          </div>
          <div>
            <Label>{t("exports.notes")}</Label>
            <Textarea value={f.additionalNotes}
              onChange={(e) => setF({ ...f, additionalNotes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={pending} className="bg-gradient-primary">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existing ? t("common.save") : t("exports.publishRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FieldT = ({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);
