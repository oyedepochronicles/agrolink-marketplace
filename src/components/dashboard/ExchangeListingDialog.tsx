// Create / edit an exchange (by-product) listing. Deliberately simpler than the
// consumer ProductFormDialog: no discount, no map pickup point, no marketplace
// visibility gating — the exchange is a farmer-to-farmer noticeboard settled
// offline. Location is optional free text (state/LGA) so a farmer can list even
// a rough area; there is no geo point.
//
// NO AUTO-CLASSIFICATION (a plan hard rule): the by-product safety fields are the
// farmer's OWN declaration, stored verbatim. The UI states plainly that PhyhanAgro
// makes no safety/edibility claim, and `notForHumanConsumption` is an explicit
// farmer toggle — never inferred.
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUploadImage } from "@/hooks/useFarmerProducts";
import {
  type ListingInput,
  useCreateExchangeListing,
  useUpdateExchangeListing,
} from "@/hooks/useExchange";
import { apiErrorMessage } from "@/lib/api";
import { NIGERIAN_STATES, lgasForState } from "@/lib/nigerianLocations";
import {
  EXCHANGE_CATEGORIES,
  EXCHANGE_UNITS,
  type ExchangeListing,
} from "@/types/exchange";
import { AlertTriangle, Loader2, Plus, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listing?: ExchangeListing;
}

type FormState = {
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  deliveryOption: NonNullable<ListingInput["deliveryOption"]>;
  state: string;
  lga: string;
  images: string[];
  suggestedUse: string;
  safetyNote: string;
  notForHumanConsumption: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  category: "Feed",
  price: 0,
  quantity: 1,
  unit: "kg",
  deliveryOption: "pickup",
  state: "",
  lga: "",
  images: [],
  suggestedUse: "",
  safetyNote: "",
  notForHumanConsumption: false,
};

const fromListing = (l: ExchangeListing): FormState => ({
  name: l.name ?? "",
  description: l.description ?? "",
  category: l.category ?? "Feed",
  price: l.price ?? 0,
  quantity: l.quantity ?? 1,
  unit: l.unit ?? "kg",
  deliveryOption: l.deliveryOption ?? "pickup",
  state: l.location?.state ?? "",
  lga: l.location?.lga ?? "",
  images: l.images ?? [],
  suggestedUse: l.byproduct?.suggestedUse ?? "",
  safetyNote: l.byproduct?.safetyNote ?? "",
  notForHumanConsumption: Boolean(l.byproduct?.notForHumanConsumption),
});

export const ExchangeListingDialog = ({ open, onOpenChange, listing }: Props) => {
  const isEdit = !!listing;
  const create = useCreateExchangeListing();
  const update = useUpdateExchangeListing();
  const upload = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open) setForm(listing ? fromListing(listing) : emptyForm);
  }, [open, listing]);

  const lgaOptions = useMemo(() => lgasForState(form.state), [form.state]);
  const saving = create.isPending || update.isPending;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => upload.mutateAsync(f)),
      );
      setForm((p) => ({ ...p, images: [...p.images, ...urls.filter(Boolean)] }));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const removeImage = (i: number) =>
    setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));

  // Build the payload. The client NEVER sends marketType — the server stamps
  // 'exchange'. byproduct is omitted entirely when the farmer declared nothing,
  // so we never fabricate an empty declaration.
  const buildInput = (): ListingInput => {
    const hasByproduct =
      form.suggestedUse.trim() ||
      form.safetyNote.trim() ||
      form.notForHumanConsumption;
    return {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      price: Number(form.price) || 0,
      quantity: Number(form.quantity) || 0,
      unit: form.unit.trim() || "unit",
      deliveryOption: form.deliveryOption,
      location:
        form.state || form.lga
          ? { state: form.state || undefined, lga: form.lga || undefined }
          : undefined,
      images: form.images,
      byproduct: hasByproduct
        ? {
            suggestedUse: form.suggestedUse.trim() || undefined,
            safetyNote: form.safetyNote.trim() || undefined,
            notForHumanConsumption: form.notForHumanConsumption,
          }
        : undefined,
    };
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("A listing name is required.");
    if (Number(form.quantity) <= 0)
      return toast.error("Quantity must be greater than zero.");
    if (Number(form.price) < 0)
      return toast.error("Price cannot be negative (use 0 for a free give-away).");
    try {
      if (isEdit && listing) {
        await update.mutateAsync({ id: listing._id, input: buildInput() });
        toast.success("Listing updated");
      } else {
        await create.mutateAsync(buildInput());
        toast.success("Listing published to the exchange");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit listing" : "New exchange listing"}</DialogTitle>
          <DialogDescription>
            List a farm by-product for other verified farmers. Set the price to 0
            to give it away free. Payment and pickup are arranged directly between
            you and the other farmer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ex-name">Name</Label>
            <Input
              id="ex-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Maize husk, cassava peel, poultry litter"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ex-desc">Description</Label>
            <Textarea
              id="ex-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Condition, how it was processed, packaging, how much is available…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {EXCHANGE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Delivery</Label>
              <Select
                value={form.deliveryOption}
                onValueChange={(v: FormState["deliveryOption"]) =>
                  setForm({ ...form, deliveryOption: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Buyer picks up</SelectItem>
                  <SelectItem value="delivery">I deliver</SelectItem>
                  <SelectItem value="both">Pickup or delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ex-price">Price (₦) — 0 = free</Label>
              <Input
                id="ex-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-qty">Quantity</Label>
              <Input
                id="ex-qty"
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm({ ...form, unit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {EXCHANGE_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>State (optional)</Label>
              <Select
                value={form.state || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, state: v === "none" ? "" : v, lga: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">No state</SelectItem>
                  {NIGERIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>LGA (optional)</Label>
              <Select
                value={form.lga || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, lga: v === "none" ? "" : v })
                }
                disabled={!form.state}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">No LGA</SelectItem>
                  {lgaOptions.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* By-product declaration — farmer's own words. NO platform classification. */}
          <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  You are declaring this information yourself.
                </span>{" "}
                PhyhanAgro does not test, classify, or certify by-products and makes
                no claim that anything here is safe, edible, or fit for any purpose.
                The buying farmer is responsible for their own checks.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ex-use">Suggested use (optional)</Label>
              <Input
                id="ex-use"
                maxLength={300}
                value={form.suggestedUse}
                onChange={(e) =>
                  setForm({ ...form, suggestedUse: e.target.value })
                }
                placeholder="e.g. Livestock feed supplement, composting"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ex-safety">Handling / safety note (optional)</Label>
              <Textarea
                id="ex-safety"
                rows={2}
                maxLength={2000}
                value={form.safetyNote}
                onChange={(e) => setForm({ ...form, safetyNote: e.target.value })}
                placeholder="e.g. Sun-dried; store dry. Not chemically treated."
              />
            </div>

            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={form.notForHumanConsumption}
                onCheckedChange={(checked) =>
                  setForm({ ...form, notForHumanConsumption: Boolean(checked) })
                }
              />
              <span>
                <span className="block font-medium">Not for human consumption</span>
                <span className="text-xs text-muted-foreground">
                  Tick this if you want to warn buyers that this by-product should
                  not be eaten by people. Leaving it unticked is not a claim that it
                  is safe to eat.
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((url, i) => (
                <div
                  key={url + i}
                  className="group relative h-20 w-20 overflow-hidden rounded-xl border"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                {upload.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isEdit ? "Save changes" : "Publish listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
