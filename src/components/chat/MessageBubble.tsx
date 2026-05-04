import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
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
  const isFile = message.attachmentType === "file" && message.attachmentUrl;
  const product = message.product;

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
        {product && (
          <Link
            to={`/marketplace/product/${product._id}`}
            className={cn(
              "flex items-center gap-2 rounded-xl p-2 no-underline transition-base",
              mine ? "bg-primary-foreground/10 hover:bg-primary-foreground/15" : "bg-background hover:bg-background/70",
            )}
          >
            <img
              src={product.images?.[0] ?? "/placeholder.svg"}
              alt={product.title}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className={cn("truncate text-xs font-semibold", mine ? "text-primary-foreground" : "text-foreground")}>
                {product.title}
              </p>
              <p className={cn("text-[11px]", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {formatNaira(product.price)}{product.unit ? ` / ${product.unit}` : ""}
              </p>
            </div>
          </Link>
        )}

        {isImage && (
          <a href={message.attachmentUrl} target="_blank" rel="noreferrer">
            <img src={message.attachmentUrl} alt="attachment" className="max-h-60 rounded-lg object-cover" />
          </a>
        )}
        {isAudio && (
          <audio src={message.attachmentUrl} controls className="h-10 w-64 max-w-full" />
        )}
        {isFile && (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 underline-offset-2 hover:underline",
              mine ? "bg-primary-foreground/10" : "bg-background",
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs font-medium">{message.attachmentName ?? "Attachment"}</span>
          </a>
        )}
        {message.body && <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>}
        <p className={cn("text-[10px] font-medium", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};
