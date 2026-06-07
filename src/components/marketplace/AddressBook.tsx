import { LocationPicker } from "@/components/LocationPicker";
import { LocationSelector } from "@/components/LocationSelector";
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
  formatAddress,
  useAddresses,
  type Address,
} from "@/hooks/useAddresses";
import { locationError } from "@/lib/nigerianLocations";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  MapPin,
  Pencil,
  Plus,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  selectedId?: string;
  onSelect?: (id: string) => void;
  selectable?: boolean;
}

const empty: Omit<Address, "id"> = {
  label: "Home",
  recipient: "",
  phone: "",
  secondPhone: "",
  street: "",
  city: "",
  lga: "",
  state: "",
  notes: "",
  coordinates: undefined,
  isDefault: false,
};

const coordinatesOf = (address: Partial<Address>) => {
  const coordinates = address.coordinates ?? address.geo?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return undefined;
  const [lng, lat] = coordinates.map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? ([lng, lat] as [number, number])
    : undefined;
};

const addressQuery = (address: Partial<Address>) =>
  [address.street, address.city, address.lga, address.state, "Nigeria"]
    .filter(Boolean)
    .join(", ");

export const AddressBook = ({ selectedId, onSelect, selectable }: Props) => {
  const { addresses, create, update, remove, setDefault, defaultAddress } =
    useAddresses();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Omit<Address, "id">>(empty);

  useEffect(() => {
    if (selectable && !selectedId && defaultAddress) {
      onSelect?.(defaultAddress.id);
    }
  }, [selectable, selectedId, defaultAddress, onSelect]);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setForm({ ...address });
    setOpen(true);
  };

  const submit = () => {
    if (
      !form.recipient.trim() ||
      !form.phone.trim() ||
      !form.street.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    const validation = locationError({
      state: form.state,
      lga: form.lga || "",
      city: form.city,
      fullAddress: form.street,
    });
    if (validation) {
      toast.error(validation);
      return;
    }

    if (!coordinatesOf(form)) {
      toast.error("Choose the exact delivery point");
      return;
    }

    if (editing) {
      update(editing.id, form);
      toast.success("Address updated");
    } else {
      const address = create(form);
      onSelect?.(address.id);
      toast.success("Address added");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Delivery addresses</h3>
          <p className="text-sm text-muted-foreground">
            Save the address and its exact map point.
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <MapPin className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No saved addresses yet</p>
          <Button size="sm" className="mt-4" onClick={openNew}>
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {addresses.map((address) => {
            const active = selectable && selectedId === address.id;
            const hasPoint = Boolean(coordinatesOf(address));
            return (
              <article
                key={address.id}
                className={cn(
                  "rounded-lg border bg-background p-4 transition",
                  active
                    ? "border-primary bg-primary/5 shadow-card"
                    : "border-border hover:border-primary/40",
                  selectable && "cursor-pointer",
                )}
                onClick={() => selectable && onSelect?.(address.id)}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{address.label}</p>
                      {address.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                          Default
                        </span>
                      )}
                      {hasPoint && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Map point
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {address.recipient} - {address.phone}
                      {address.secondPhone ? ` / ${address.secondPhone}` : ""}
                    </p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {formatAddress(address)}
                    </p>
                    {address.notes && (
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {address.notes}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex shrink-0 items-center gap-1 self-end sm:self-start"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title={address.isDefault ? "Default" : "Set as default"}
                      onClick={() =>
                        !address.isDefault && setDefault(address.id)
                      }
                    >
                      {address.isDefault ? (
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(address)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit delivery address" : "Add delivery address"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label">
              <Input
                value={form.label}
                onChange={(event) =>
                  setForm({ ...form, label: event.target.value })
                }
                placeholder="Home, office, shop"
              />
            </Field>
            <Field label="Recipient *">
              <Input
                value={form.recipient}
                onChange={(event) =>
                  setForm({ ...form, recipient: event.target.value })
                }
              />
            </Field>
            <Field label="Phone *">
              <Input
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                placeholder="+234..."
              />
            </Field>
            <Field label="Second phone">
              <Input
                value={form.secondPhone ?? ""}
                onChange={(event) =>
                  setForm({ ...form, secondPhone: event.target.value })
                }
                placeholder="Optional"
              />
            </Field>
            <LocationSelector
              label="Delivery location"
              addressLabel="Street address"
              className="sm:col-span-2"
              showLandmark={false}
              value={{
                state: form.state,
                lga: form.lga || "",
                city: form.city,
                fullAddress: form.street,
              }}
              onChange={(location) =>
                setForm({
                  ...form,
                  state: location.state,
                  lga: location.lga,
                  city: location.city || "",
                  street: location.fullAddress || "",
                })
              }
            />
            <Field label="Delivery notes" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.notes ?? ""}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                placeholder="Landmark, gate, building color"
              />
            </Field>
          </div>

          <LocationPicker
            label="Exact delivery point *"
            addressQuery={addressQuery(form)}
            value={
              coordinatesOf(form)
                ? { lng: coordinatesOf(form)![0], lat: coordinatesOf(form)![1] }
                : undefined
            }
            onChange={(point) =>
              setForm({ ...form, coordinates: [point.lng, point.lat] })
            }
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.isDefault)}
              onChange={(event) =>
                setForm({ ...form, isDefault: event.target.checked })
              }
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Set as default address
          </label>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>
              {editing ? "Save changes" : "Add address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);
