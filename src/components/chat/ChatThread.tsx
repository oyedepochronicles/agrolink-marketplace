import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, useMessageSocket, useSendMessage, uploadFile } from "@/hooks/useChat";
import { apiErrorMessage } from "@/lib/api";
import { formatNaira, initials } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./MessageBubble";
import { VoiceRecorder } from "./VoiceRecorder";
import { AttachmentPicker } from "./AttachmentPicker";
import type { Conversation, User } from "@/types";

interface Props {
  conversation: Conversation;
  onBack?: () => void;
}

const otherParticipant = (c: Conversation, meId?: string): User | undefined =>
  c.participants?.find((p) => p._id !== meId) ?? c.participants?.[0];

export const ChatThread = ({ conversation, onBack }: Props) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(conversation._id);
  const send = useSendMessage();
  useMessageSocket(conversation._id);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: "image" | "file" } | null>(null);
  // Attach the conversation's product to the FIRST message in this session as context
  const [pendingProductId, setPendingProductId] = useState<string | undefined>(conversation.product?._id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const other = otherParticipant(conversation, user?._id);

  useEffect(() => {
    setPendingProductId(conversation.product?._id);
  }, [conversation._id, conversation.product?._id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length]);

  const submitText = async () => {
    const body = text.trim();
    if (!body && !attachment) return;
    const att = attachment;
    setText("");
    setAttachment(null);
    try {
      await send.mutateAsync({
        conversationId: conversation._id,
        body: body || undefined,
        attachmentUrl: att?.url,
        attachmentName: att?.name,
        attachmentType: att?.type,
        productId: pendingProductId,
      });
      setPendingProductId(undefined);
    } catch (e) {
      toast.error(apiErrorMessage(e));
      setText(body);
      setAttachment(att);
    }
  };

  const submitVoice = async (blob: Blob) => {
    try {
      const url = await uploadFile(blob, `voice-${Date.now()}.webm`);
      if (!url) throw new Error("Upload failed");
      await send.mutateAsync({
        conversationId: conversation._id,
        attachmentUrl: url,
        attachmentType: "audio",
        productId: pendingProductId,
      });
      setPendingProductId(undefined);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const product = conversation.product;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/50 px-4">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="md:hidden">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage src={other?.avatar} alt={other?.name} />
          <AvatarFallback className="bg-primary/10 text-primary">{initials(other?.name ?? "?")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{other?.name ?? "Conversation"}</p>
          <p className="truncate text-xs capitalize text-muted-foreground">{other?.role ?? ""}</p>
        </div>
        {product && (
          <Link
            to={`/marketplace/product/${product._id}`}
            className="hidden items-center gap-2 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs hover:bg-secondary/70 sm:flex"
          >
            <img src={product.images?.[0] ?? "/placeholder.svg"} alt="" className="h-6 w-6 rounded object-cover" />
            <span className="max-w-[140px] truncate font-medium">{product.title}</span>
            <span className="text-muted-foreground">· {formatNaira(product.price)}</span>
          </Link>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={`h-12 ${i % 2 ? "ml-auto w-1/2" : "w-2/3"} rounded-2xl`} />
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Say hello 👋
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m._id} message={m} mine={m.sender === user?._id} />
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-card/50 p-3">
        {pendingProductId && product && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-2 text-xs">
            <img src={product.images?.[0] ?? "/placeholder.svg"} alt="" className="h-8 w-8 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">Referencing: {product.title}</p>
              <p className="text-muted-foreground">{formatNaira(product.price)} — attached to your next message</p>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPendingProductId(undefined)} aria-label="Remove product reference">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <VoiceRecorder onSend={submitVoice} disabled={send.isPending} />
          <AttachmentPicker picked={attachment} onPicked={setAttachment} disabled={send.isPending} />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submitText();
              }
            }}
            placeholder="Write a message..."
            rows={1}
            className="min-h-[44px] flex-1 resize-none rounded-2xl bg-secondary"
          />
          <Button
            size="icon"
            onClick={submitText}
            disabled={(!text.trim() && !attachment) || send.isPending}
            className="rounded-full bg-primary"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
