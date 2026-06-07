import { LocationPicker } from "@/components/LocationPicker";
import { LocationSelector } from "@/components/LocationSelector";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import {
  type ProductInput,
  useCreateProduct,
  useUpdateProduct,
  useUploadImage,
} from "@/hooks/useFarmerProducts";
import { apiErrorMessage } from "@/lib/api";
import { locationError } from "@/lib/nigerianLocations";
import type { Product } from "@/types";
import { Loader2, MapPin, Plus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const CATEGORIES = [
  "Grains",
  "Vegetables",
  "Fruits",
  "Tubers",
  "Livestock",
  "Dairy",
  "Spices",
  "Other",
];

type PickupLocation = {
  id: string;
  label: string;
  state: string;
  lga: string;
  fullAddress: string;
  city: string;
  landmark?: string;
  coordinates: [number, number];
};

const PICKUP_KEY = "phyhan.pickupLocations";

const readPickupLocations = (): PickupLocation[] => {
  try {
    return JSON.parse(localStorage.getItem(PICKUP_KEY) || "[]");
  } catch {
    return [];
  }
};

const writePickupLocations = (items: PickupLocation[]) => {
  localStorage.setItem(PICKUP_KEY, JSON.stringify(items));
};

const pickupAddressQuery = (location?: ProductInput["location"]) =>
  [
    location?.fullAddress,
    location?.city,
    location?.lga,
    location?.state,
    "Nigeria",
  ]
    .filter(Boolean)
    .join(", ");

const toDateInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: Product;
}

export const ProductFormDialog = ({ open, onOpenChange, product }: Props) => {
  const isEdit = !!product;
  const create = useCreateProduct();
  const update = useUpdateProduct(product?._id ?? "");
  const upload = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>(() =>
    readPickupLocations(),
  );

  const [form, setForm] = useState<ProductInput>({
    title: "",
    description: "",
    price: 0,
    discount: { type: "none", value: 0 },
    unit: "kg",
    category: "Grains",
    state: "Lagos",

    stock: 0,
    harvestDate: toDateInput(new Date().toISOString()),
    isPreHarvest: false,
    images: [],
    location: {
      state: "Lagos",
      lga: "",
      fullAddress: "",
      landmark: "",
      city: "",
    },
  });

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? {
              title: product.title || product.name || "",
              description: product.description ?? "",
              price: product.price,
              discount: product.discount ?? { type: "none", value: 0 },
              unit: product.unit ?? "kg",
              category: product.category ?? "Grains",
              state: product.location?.state ?? product.state ?? "Lagos",
              stock: product.stock ?? 0,
              harvestDate: toDateInput(product.harvestDate),
              expectedHarvestDate: toDateInput(product.expectedHarvestDate),
              isPreHarvest: Boolean(product.isPreHarvest),
              images: product.images ?? [],
              location: {
                state: product.location?.state ?? product.state ?? "Lagos",
                lga: product.location?.lga ?? "",
                fullAddress: product.location?.fullAddress ?? "",
                landmark: product.location?.landmark ?? "",
                city: product.location?.city ?? "",
                coordinates:
                  product.location?.geo?.coordinates?.length === 2
                    ? [
                        Number(product.location.geo.coordinates[0]),
                        Number(product.location.geo.coordinates[1]),
                      ]
                    : undefined,
              },
            }
          : {
              title: "",
              description: "",
              price: 0,
              discount: { type: "none", value: 0 },
              unit: "kg",
              category: "Grains",
              state: "Lagos",
              stock: 0,
              harvestDate: toDateInput(new Date().toISOString()),
              isPreHarvest: false,
              images: [],
              location: {
                state: "Lagos",
                lga: "",
                fullAddress: "",
                landmark: "",
                city: "",
              },
            },
      );
    }
  }, [open, product]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => upload.mutateAsync(f)),
      );
      setForm((p) => ({
        ...p,
        images: [...(p.images ?? []), ...urls.filter(Boolean)],
      }));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const removeImage = (i: number) =>
    setForm((p) => ({
      ...p,
      images: (p.images ?? []).filter((_, idx) => idx !== i),
    }));

  const submit = async () => {
    if (!form.title.trim() || form.price <= 0) {
      toast.error("Title and a valid price are required.");
      return;
    }
    const locationValidation = locationError(form.location || {});
    if (locationValidation) {
      toast.error(locationValidation);
      return;
    }
    if (!form.location?.coordinates) {
      toast.error("Pick the exact pickup point on the map.");
      return;
    }
    try {
      if (isEdit) await update.mutateAsync(form);
      else await create.mutateAsync(form);
      toast.success(isEdit ? "Product updated" : "Product created");
      onOpenChange(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const savePickupLocation = () => {
    if (
      !form.location?.state ||
      !form.location.lga ||
      !form.location?.city ||
      !form.location.fullAddress ||
      !form.location.coordinates
    ) {
      toast.error("Complete the pickup address and map point first.");
      return;
    }
    const next: PickupLocation = {
      id: `pickup_${Date.now()}`,
      label: form.location.fullAddress.slice(0, 42),
      state: form.location.state,
      lga: form.location.lga,
      city: form.location.city,
      fullAddress: form.location.fullAddress,
      landmark: form.location.landmark,
      coordinates: form.location.coordinates,
    };
    const updated = [next, ...pickupLocations].slice(0, 8);
    writePickupLocations(updated);
    setPickupLocations(updated);
    toast.success("Pickup location saved");
  };

  const applyPickupLocation = (id: string) => {
    const location = pickupLocations.find((item) => item.id === id);
    if (!location) return;
    setForm({
      ...form,
      state: location.state,
      location: {
        state: location.state,
        lga: location.lga,
        city: location.city,
        fullAddress: location.fullAddress,
        landmark: location.landmark,
        coordinates: location.coordinates,
      },
    });
  };

  const saving = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Premium yellow maize"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Tell buyers about freshness, origin, packaging..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (₦)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="kg, bag, crate"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <div className="space-y-1.5">
              <Label>Discount type</Label>
              <Select
                value={form.discount?.type || "none"}
                onValueChange={(type: "none" | "fixed" | "percentage") =>
                  setForm({
                    ...form,
                    discount: {
                      ...(form.discount || {}),
                      type,
                      value: type === "none" ? 0 : form.discount?.value || 0,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No discount</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discountValue">
                {form.discount?.type === "percentage" ? "Discount (%)" : "Discount (NGN)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min={0}
                max={form.discount?.type === "percentage" ? 100 : undefined}
                disabled={!form.discount?.type || form.discount.type === "none"}
                value={form.discount?.value ?? 0}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount: {
                      ...(form.discount || { type: "fixed" }),
                      value: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
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
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label>Pickup address</Label>
              </div>
              <div className="flex gap-2">
                {pickupLocations.length > 0 && (
                  <Select onValueChange={applyPickupLocation}>
                    <SelectTrigger className="h-8 w-[180px]">
                      <SelectValue placeholder="Saved pickups" />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupLocations.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={savePickupLocation}
                >
                  Save pickup
                </Button>
              </div>
            </div>
            <LocationSelector
              label="Pickup administrative location"
              addressLabel="Full pickup address"
              value={{
                state: form.location?.state || form.state || "",
                lga: form.location?.lga || "",
                city: form.location?.city || "",
                landmark: form.location?.landmark || "",
                fullAddress: form.location?.fullAddress || "",
              }}
              onChange={(location) =>
                setForm({
                  ...form,
                  state: location.state,
                  location: {
                    ...(form.location || { coordinates: undefined }),
                    ...location,
                  },
                })
              }
            />
            <LocationPicker
              label="Exact pickup point *"
              addressQuery={pickupAddressQuery(form.location)}
              value={
                form.location?.coordinates
                  ? {
                      lng: form.location.coordinates[0],
                      lat: form.location.coordinates[1],
                    }
                  : undefined
              }
              onChange={(point) =>
                setForm({
                  ...form,
                  location: {
                    ...(form.location || {
                      state: form.state || "Lagos",
                      lga: "",
                    }),
                    coordinates: [point.lng, point.lat],
                  },
                })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="harvestDate">Harvest date</Label>
              <Input
                id="harvestDate"
                type="date"
                value={form.harvestDate ?? ""}
                onChange={(e) =>
                  setForm({ ...form, harvestDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expectedHarvestDate">Expected harvest date</Label>
              <Input
                id="expectedHarvestDate"
                type="date"
                value={form.expectedHarvestDate ?? ""}
                onChange={(e) =>
                  setForm({ ...form, expectedHarvestDate: e.target.value })
                }
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
            <Checkbox
              checked={Boolean(form.isPreHarvest)}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  isPreHarvest: Boolean(checked),
                  expectedHarvestDate:
                    form.expectedHarvestDate || form.harvestDate,
                })
              }
            />
            <span>
              <span className="block font-medium">Pre-harvest listing</span>
              <span className="text-xs text-muted-foreground">
                Let buyers reserve produce before harvest to reduce post-harvest
                loss.
              </span>
            </span>
          </label>

          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex flex-wrap gap-3">
              {(form.images ?? []).map((url, i) => (
                <div
                  key={url + i}
                  className="group relative h-20 w-20 overflow-hidden rounded-xl border"
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
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
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
