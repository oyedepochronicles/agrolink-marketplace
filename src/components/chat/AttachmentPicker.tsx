import { Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/hooks/useChat";
import { apiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

interface PickedFile {
  url: string;
  name: string;
  type: "image" | "file";
}

interface Props {
  disabled?: boolean;
  picked: PickedFile | null;
  onPicked: (f: PickedFile | null) => void;
}

const MAX_BYTES = 10 * 1024 * 1024;

export const AttachmentPicker = ({ disabled, picked, onPicked }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_BYTES) { toast.error("Max attachment size is 10MB"); return; }
    setBusy(true);
    try {
      const url = await uploadFile(file, file.name);
      if (!url) throw new Error("Upload failed");
      onPicked({ url, name: file.name, type: file.type.startsWith("image/") ? "image" : "file" });
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (picked) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-2 py-1 text-xs">
        {picked.type === "image" ? (
          <img src={picked.url} alt="" className="h-7 w-7 rounded object-cover" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
        <span className="max-w-[120px] truncate font-medium">{picked.name}</span>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onPicked(null)} aria-label="Remove attachment">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="rounded-full"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        aria-label="Attach file"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
    </>
  );
};
