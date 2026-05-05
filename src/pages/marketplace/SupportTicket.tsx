import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useReplyTicket, useTicket } from "@/hooks/useSupport";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SupportTicketStatus } from "@/types";

const STATUS_TONE: Record<SupportTicketStatus, string> = {
  open: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-warning/10 text-warning-foreground border-warning/40",
  resolved: "bg-success/10 text-success-foreground border-success/40",
  closed: "bg-muted text-muted-foreground border-border",
};

const formatDateTime = (iso: string) => {
  try { return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
};

const SupportTicket = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: ticket, isLoading } = useTicket(id);
  const reply = useReplyTicket(id);
  const [body, setBody] = useState("");

  if (!user) return <Navigate to="/login" replace />;

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    try {
      await reply.mutateAsync(text);
      setBody("");
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <Link to="/marketplace/support" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to help center
      </Link>

      {isLoading || !ticket ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <>
          <Card className="rounded-2xl p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-extrabold">{ticket.subject}</h1>
                <p className="text-xs text-muted-foreground">Opened {formatDateTime(ticket.createdAt)}</p>
              </div>
              <Badge variant="outline" className={STATUS_TONE[ticket.status]}>{ticket.status}</Badge>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{ticket.body}</p>
          </Card>

          <div className="space-y-3">
            {(ticket.replies ?? []).map((r) => {
              const mine = r.author?._id === user._id;
              return (
                <div key={r._id} className={cn("flex gap-3", mine ? "flex-row-reverse" : "flex-row")}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.author?.avatar} alt={r.author?.name} />
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(r.author?.name ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", mine ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md bg-secondary")}>
                    <div className="mb-0.5 flex items-center gap-2 text-[11px] opacity-80">
                      <span className="font-semibold capitalize">{r.author?.role === "admin" ? "Support" : r.author?.name}</span>
                      <span>· {formatDateTime(r.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{r.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {ticket.status !== "closed" ? (
            <Card className="rounded-2xl p-3 shadow-card">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000} placeholder="Write a reply..." />
              <div className="mt-2 flex justify-end">
                <Button onClick={submit} disabled={reply.isPending || !body.trim()}>
                  {reply.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send reply
                </Button>
              </div>
            </Card>
          ) : (
            <p className="text-center text-xs text-muted-foreground">This ticket is closed.</p>
          )}
        </>
      )}
    </div>
  );
};

export default SupportTicket;
