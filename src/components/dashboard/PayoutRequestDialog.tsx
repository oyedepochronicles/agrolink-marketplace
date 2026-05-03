import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequestPayout } from "@/hooks/useWallet";
import { apiErrorMessage } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";

interface Props { available: number; trigger: React.ReactNode }

export const PayoutRequestDialog = ({ available, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [note, setNote] = useState("");
  const request = useRequestPayout();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Enter a valid amount");
    if (n > available) return toast.error("Amount exceeds your available balance");
    if (!bankName || !accountNumber || !accountName) return toast.error("Bank details required");
    try {
      await request.mutateAsync({ amount: n, bankAccount: { bankName, accountNumber, accountName }, note });
      toast.success("Payout request submitted");
      setOpen(false);
      setAmount(""); setNote("");
    } catch (err) { toast.error(apiErrorMessage(err)); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request payout</DialogTitle>
          <DialogDescription>Available balance: {formatNaira(available)}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Amount (NGN)</Label>
            <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Bank name</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Account number</Label>
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Account name</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={request.isPending}>{request.isPending ? "Submitting…" : "Request payout"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
