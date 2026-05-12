import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignRider, useRiders } from "@/hooks/useOrders";
import { apiErrorMessage } from "@/lib/api";
import { initials } from "@/lib/format";
import type { Order } from "@/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  order: Order;
  trigger: React.ReactNode;
}

export const AssignRiderDialog = ({ order, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [riderId, setRiderId] = useState(order.rider?._id ?? "");
  const { data: riders = [], isLoading } = useRiders(order);
  const assign = useAssignRider();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderId) return toast.error("Select a rider");
    try {
      await assign.mutateAsync({ id: order._id, riderId });
      toast.success("Rider assigned");
      setOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const selected = riders.find((r) => r._id === riderId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign a rider</DialogTitle>
          <DialogDescription>
            Pick a rider to deliver this order to{" "}
            {order.buyer?.name ?? "the buyer"}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Rider</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading riders…
              </div>
            ) : riders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No riders available.
              </p>
            ) : (
              <Select value={riderId} onValueChange={setRiderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a rider" />
                </SelectTrigger>
                <SelectContent>
                  {riders.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                      {r.state ? ` • ${r.state}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selected && (
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selected.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials(selected.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-semibold">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.phone ?? selected.email}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={assign.isPending || !riderId}>
              {assign.isPending ? "Assigning…" : "Assign rider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
