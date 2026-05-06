import { ChatThread } from "@/components/chat/ChatThread";
import { ConversationList } from "@/components/chat/ConversationList";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";
import { MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Props {
  /** Layout chrome: dashboard pages render flush; marketplace page wraps in container. */
  variant?: "dashboard" | "marketplace";
}

const Messages = ({ variant = "dashboard" }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: conversations, isLoading } = useConversations();
  const requestedId = params.get("conversation") ?? undefined;
  const [activeId, setActiveId] = useState<string | undefined>(requestedId);

  useEffect(() => {
    if (requestedId) setActiveId(requestedId);
  }, [requestedId]);

  // Auto-select first conversation on desktop
  useEffect(() => {
    if (
      !activeId &&
      conversations &&
      conversations.length > 0 &&
      window.innerWidth >= 768
    ) {
      setActiveId(conversations[0]._id);
    }
  }, [conversations, activeId]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const active: Conversation | undefined = useMemo(
    () => conversations?.find((c) => c._id === activeId),
    [conversations, activeId],
  );

  const handleSelect = (c: Conversation) => {
    setActiveId(c._id);
    setParams(
      (p) => {
        p.set("conversation", c._id);
        return p;
      },
      { replace: true },
    );
  };

  const handleBack = () => {
    setActiveId(undefined);
    setParams(
      (p) => {
        p.delete("conversation");
        return p;
      },
      { replace: true },
    );
  };

  const handleDelete = (id) => {
    setActiveId(undefined);
  };

  const wrap = variant === "marketplace" ? "container py-6" : "";

  return (
    <div className={wrap}>
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-card">
        <div className="grid h-[calc(100vh-12rem)] min-h-[520px] grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <aside
            className={cn(
              "flex min-h-0 flex-col border-border bg-card/30 md:border-r",
              activeId ? "hidden md:flex" : "flex",
            )}
          >
            <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="font-display font-bold">Messages</h2>
            </div>
            <div className="min-h-0 flex-1">
              <ConversationList
                conversations={conversations}
                isLoading={isLoading}
                activeId={activeId}
                onDelete={handleDelete}
                currentUserId={user?._id}
                onSelect={handleSelect}
              />
            </div>
          </aside>

          {/* Thread */}
          <section
            className={cn(
              "min-h-0",
              activeId ? "flex" : "hidden md:flex",
              "flex-col",
            )}
          >
            {active ? (
              <ChatThread conversation={active} onBack={handleBack} />
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <div className="space-y-2 px-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-display text-lg font-bold">
                    Select a conversation
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your messages with farmers, riders, and buyers will appear
                    here.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Messages;
