import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSetPickupDetails } from "@/hooks/useOrders";
import { apiErrorMessage } from "@/lib/api";
import type { Order } from "@/types";

interface Props {
  order: Order;
  trigger: React.ReactNode;
}

// Farmer marks a paid order ready for pickup and shares logistics with riders.
// Mirrors OfflinePaymentDialog so the two order actions feel consistent.
export const PickupDetailsDialog = ({ order, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [readyAt, setReadyAt] = useState("");
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const setPickup = useSetPickupDetails();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setPickup.mutateAsync({
        id: order._id,
        // datetime-local is local time; ISO-encode so the server stores UTC.
        readyAt: readyAt ? new Date(readyAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      });
      toast.success("Pickup details saved — riders have been notified");
      setOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set pickup details</DialogTitle>
          <DialogDescription>
            Tell riders when the order will be ready and how to reach you. This marks the
            order ready for pickup.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Ready at</Label>
            <Input
              type="datetime-local"
              value={readyAt}
              onChange={(e) => setReadyAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Contact phone (optional)</Label>
            <Input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Phone the rider should call"
            />
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pickup location details, gate code, landmark, etc."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={setPickup.isPending}>
              {setPickup.isPending ? "Saving…" : "Save & notify riders"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
