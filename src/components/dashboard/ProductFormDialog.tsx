import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import {
  type ProductInput,
  useCreateProduct,
  useUpdateProduct,
  useUploadImage,
} from "@/hooks/useFarmerProducts";
import type { Product } from "@/types";

const CATEGORIES = ["Grains", "Vegetables", "Fruits", "Tubers", "Livestock", "Dairy", "Spices", "Other"];
const STATES = [
  "Lagos", "Abuja", "Kano", "Kaduna", "Rivers", "Oyo", "Ogun", "Anambra",
  "Enugu", "Plateau", "Benue", "Cross River", "Edo", "Delta", "Imo", "Other",
];

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

  const [form, setForm] = useState<ProductInput>({
    title: "", description: "", price: 0, unit: "kg",
    category: "Grains", state: "Lagos", stock: 0, images: [],
  });

  useEffect(() => {
    if (open) {
      setForm(product ? {
        title: product.title,
        description: product.description ?? "",
        price: product.price,
        unit: product.unit ?? "kg",
        category: product.category ?? "Grains",
        state: product.state ?? "Lagos",
        stock: product.stock ?? 0,
        images: product.images ?? [],
      } : {
        title: "", description: "", price: 0, unit: "kg",
        category: "Grains", state: "Lagos", stock: 0, images: [],
      });
    }
  }, [open, product]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const urls = await Promise.all(Array.from(files).map((f) => upload.mutateAsync(f)));
      setForm((p) => ({ ...p, images: [...(p.images ?? []), ...urls.filter(Boolean)] }));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const removeImage = (i: number) =>
    setForm((p) => ({ ...p, images: (p.images ?? []).filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.title.trim() || form.price <= 0) {
      toast.error("Title and a valid price are required.");
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
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Premium yellow maize" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell buyers about freshness, origin, packaging..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (₦)</Label>
              <Input id="price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, bag, crate" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex flex-wrap gap-3">
              {(form.images ?? []).map((url, i) => (
                <div key={url + i} className="group relative h-20 w-20 overflow-hidden rounded-xl border">
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
                {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
