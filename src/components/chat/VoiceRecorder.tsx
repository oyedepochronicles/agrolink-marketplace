import { Mic, Square, Trash2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (blob: Blob) => Promise<void> | void;
  disabled?: boolean;
}

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export const VoiceRecorder = ({ onSend, disabled }: Props) => {
  const { isRecording, durationMs, blob, error, start, stop, cancel, reset } = useVoiceRecorder();
  const [sending, setSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (!blob) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (blob) {
    return (
      <div className="flex w-full items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2">
        <audio src={previewUrl} controls className="h-8 flex-1 min-w-0" />
        <Button size="icon" variant="ghost" onClick={reset} aria-label="Discard">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
        <Button
          size="icon"
          className="rounded-full bg-primary"
          disabled={sending || disabled}
          onClick={async () => {
            setSending(true);
            try { await onSend(blob); reset(); } finally { setSending(false); }
          }}
          aria-label="Send voice note"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-2">
        <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
        <span className="font-mono text-sm tabular-nums text-destructive">{fmt(durationMs)}</span>
        <Button size="icon" variant="ghost" onClick={cancel} aria-label="Cancel">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="icon" className="rounded-full" onClick={stop} aria-label="Stop">
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={start}
      disabled={disabled}
      title={error ?? "Record voice note"}
      className={cn("rounded-full", error && "text-destructive")}
      aria-label="Record voice note"
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
};
