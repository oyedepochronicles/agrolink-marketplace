import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Conversation, User } from "@/types";

interface Props {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  activeId?: string;
  currentUserId?: string;
  onSelect: (c: Conversation) => void;
}

const otherParticipant = (c: Conversation, meId?: string): User | undefined =>
  c.participants?.find((p) => p._id !== meId) ?? c.participants?.[0];

const previewText = (c: Conversation): string => {
  const m = c.lastMessage;
  if (!m) return "Start the conversation";
  if (m.body) return m.body;
  if (m.attachmentType === "audio") return "🎤 Voice note";
  if (m.attachmentType === "image") return "📷 Photo";
  return "Attachment";
};

export const ConversationList = ({ conversations, isLoading, activeId, currentUserId, onSelect }: Props) => {
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        <p className="font-medium">No conversations yet</p>
        <p className="mt-1 text-xs">Message a seller from a product page to get started.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <ul className="space-y-1 p-2">
        {conversations.map((c) => {
          const other = otherParticipant(c, currentUserId);
          const isActive = c._id === activeId;
          return (
            <li key={c._id}>
              <button
                onClick={() => onSelect(c)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-base",
                  isActive ? "bg-primary/10" : "hover:bg-secondary",
                )}
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage src={other?.avatar} alt={other?.name} />
                  <AvatarFallback className="bg-primary/10 text-sm text-primary">
                    {initials(other?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{other?.name ?? "Unknown"}</p>
                    {!!c.unreadCount && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{previewText(c)}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
};
