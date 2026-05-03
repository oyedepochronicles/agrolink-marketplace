import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Star, StarOff } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddresses, type Address, formatAddress } from "@/hooks/useAddresses";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  selectedId?: string;
  onSelect?: (id: string) => void;
  selectable?: boolean;
}

const empty = { label: "Home", recipient: "", phone: "", street: "", city: "", state: "", notes: "", isDefault: false };

export const AddressBook = ({ selectedId, onSelect, selectable }: Props) => {
  const { addresses, create, update, remove, setDefault, defaultAddress } = useAddresses();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Omit<Address, "id">>(empty);

  // auto-select default when nothing selected yet
  useEffect(() => {
    if (selectable && !selectedId && defaultAddress) onSelect?.(defaultAddress.id);
  }, [selectable, selectedId, defaultAddress, onSelect]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (a: Address) => { setEditing(a); setForm({ ...a }); setOpen(true); };

  const submit = () => {
    if (!form.recipient.trim() || !form.phone.trim() || !form.street.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (editing) {
      update(editing.id, form);
      toast.success("Address updated");
    } else {
      const a = create(form);
      onSelect?.(a.id);
      toast.success("Address added");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Delivery addresses</h3>
        <Button size="sm" variant="outline" className="rounded-full" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No saved addresses yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((a) => {
            const active = selectable && selectedId === a.id;
            return (
              <div
                key={a.id}
                className={cn(
                  "rounded-2xl border p-4 transition-base",
                  active ? "border-primary bg-primary/5 shadow-card" : "border-border hover:border-primary/40",
                  selectable && "cursor-pointer",
                )}
                onClick={() => selectable && onSelect?.(a.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{a.label}</p>
                      {a.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{a.recipient} · {a.phone}</p>
                    <p className="text-xs text-muted-foreground">{formatAddress(a)}</p>
                    {a.notes && <p className="mt-1 text-xs italic text-muted-foreground">“{a.notes}”</p>}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title={a.isDefault ? "Default" : "Set as default"}
                      onClick={() => !a.isDefault && setDefault(a.id)}
                    >
                      {a.isDefault ? <Star className="h-4 w-4 fill-primary text-primary" /> : <StarOff className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit address" : "New address"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Label">
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Office..." />
              </Field>
              <Field label="Recipient *">
                <Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
              </Field>
            </div>
            <Field label="Phone *">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234..." />
            </Field>
            <Field label="Street *">
              <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City *">
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="State *">
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </Field>
            </div>
            <Field label="Delivery notes">
              <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Landmarks, gate code..." />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Set as default address
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-full bg-gradient-primary" onClick={submit}>
              {editing ? "Save changes" : "Add address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);
