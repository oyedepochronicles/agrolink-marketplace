import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRecordOfflinePayment } from "@/hooks/useOrders";
import { apiErrorMessage } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import type { Order } from "@/types";

interface Props { order: Order; trigger: React.ReactNode }

const PLATFORM_FEE_RATE = 0.05;

export const OfflinePaymentDialog = ({ order, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(order.totalAmount ?? ""));
  const [quantity, setQuantity] = useState(String(order.quantity ?? 1));
  const [note, setNote] = useState("");
  const record = useRecordOfflinePayment();

  const fee = Math.round(Number(amount || 0) * PLATFORM_FEE_RATE);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = Number(amount); const q = Number(quantity);
    if (!a || a <= 0) return toast.error("Enter the amount received");
    if (!q || q <= 0) return toast.error("Enter the quantity sold");
    try {
      await record.mutateAsync({ id: order._id, amount: a, quantity: q, note });
      toast.success("Payment recorded — platform fee deducted from wallet");
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
          <DialogTitle>Record offline payment</DialogTitle>
          <DialogDescription>
            Mark this order as paid when the buyer paid you outside the app. The platform fee
            ({Math.round(PLATFORM_FEE_RATE * 100)}%) is taken from your wallet balance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount received (NGN)</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Quantity sold</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bank transfer, cash on pickup, etc." />
          </div>
          <div className="rounded-lg bg-secondary p-3 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Platform fee</span><span className="font-semibold">{formatNaira(fee)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Deducted from wallet</span><span className="font-semibold text-destructive">−{formatNaira(fee)}</span></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={record.isPending}>{record.isPending ? "Recording…" : "Mark as paid"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
