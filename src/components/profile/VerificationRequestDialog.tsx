import { useState } from "react";
import { Loader2, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadFile } from "@/hooks/useChat";
import { useSubmitVerification } from "@/hooks/useProfile";
import { apiErrorMessage } from "@/lib/api";

const DOC_TYPES = [
  { value: "nin", label: "National ID (NIN)" },
  { value: "passport", label: "International Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "business_doc", label: "Business / CAC Document" },
];

interface Props {
  trigger: React.ReactNode;
}

export const VerificationRequestDialog = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState("nin");
  const [docNumber, setDocNumber] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState<"doc" | "selfie" | null>(null);
  const submit = useSubmitVerification();

  const handleUpload = async (file: File | undefined, kind: "doc" | "selfie") => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max file size is 10MB"); return; }
    setUploading(kind);
    try {
      const url = await uploadFile(file, file.name);
      if (!url) throw new Error("Upload failed");
      if (kind === "doc") { setDocUrl(url); setDocName(file.name); }
      else setSelfieUrl(url);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setUploading(null); }
  };

  const onSubmit = async () => {
    if (!docUrl) { toast.error("Upload your document first"); return; }
    try {
      await submit.mutateAsync({
        documentType: docType,
        documentNumber: docNumber || undefined,
        documentUrl: docUrl,
        selfieUrl: selfieUrl || undefined,
        note: note || undefined,
      });
      toast.success("Verification submitted — we'll review shortly");
      setOpen(false);
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Request verification</DialogTitle>
          <DialogDescription>Upload an official ID document. We'll review and notify you when complete.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Document type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="docNumber">Document number (optional)</Label>
            <Input id="docNumber" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} maxLength={50} />
          </div>
          <div className="space-y-1.5">
            <Label>Document upload</Label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 hover:border-primary">
              <span className="text-sm text-muted-foreground truncate">{docName || "Click to upload (PDF or image, ≤10MB)"}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                {uploading === "doc" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {docUrl ? "Replace" : "Upload"}
              </span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], "doc")} />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>Selfie holding ID (optional)</Label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 hover:border-primary">
              <span className="text-sm text-muted-foreground truncate">{selfieUrl ? "Selfie uploaded" : "Helps speed up verification"}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                {uploading === "selfie" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {selfieUrl ? "Replace" : "Upload"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], "selfie")} />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submit.isPending || !docUrl}>
            {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
