import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface Props {
  message: Message;
  mine: boolean;
}

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

export const MessageBubble = ({ message, mine }: Props) => {
  const isAudio = message.attachmentType === "audio" && message.attachmentUrl;
  const isImage = message.attachmentType === "image" && message.attachmentUrl;

  return (
    <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] space-y-1.5 rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
          mine
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-secondary text-foreground",
        )}
      >
        {isImage && (
          <a href={message.attachmentUrl} target="_blank" rel="noreferrer">
            <img src={message.attachmentUrl} alt="attachment" className="max-h-60 rounded-lg object-cover" />
          </a>
        )}
        {isAudio && (
          <audio src={message.attachmentUrl} controls className="h-10 w-64 max-w-full" />
        )}
        {message.body && <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>}
        <p className={cn("text-[10px] font-medium", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};
