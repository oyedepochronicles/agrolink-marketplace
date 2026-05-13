import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useJsonLd, usePageMeta } from "@/hooks/usePageMeta";
import { useCreateTicket, useFaqs, useMyTickets } from "@/hooks/useSupport";
import { apiErrorMessage } from "@/lib/api";
import type { SupportTicketStatus } from "@/types";
import { HelpCircle, Loader2, MessageCircle, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const STATUS_TONE: Record<SupportTicketStatus, string> = {
  open: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-warning/10 text-warning-foreground border-warning/40",
  resolved: "bg-success/10 text-success-foreground border-success/40",
  closed: "bg-muted text-muted-foreground border-border",
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
};

const Support = () => {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const { data: faqs = [], isLoading: faqLoading } = useFaqs();
  const { data: tickets = [], isLoading: ticketsLoading } = useMyTickets();
  const create = useCreateTicket();

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return faqs;
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term),
    );
  }, [faqs, q]);

  usePageMeta({
    title: "Support and FAQ | PhyhanAgro",
    description:
      "Browse support articles or open a ticket for help with orders, deliveries, and account issues on PhyhanAgro.",
    path: "/marketplace/support",
    image: "/og-image.svg",
  });

  const supportStructuredData = useMemo(
    () =>
      faqs.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }
        : null,
    [faqs],
  );

  useJsonLd(supportStructuredData);

  const submit = async () => {
    const s = subject.trim();
    const b = body.trim();
    if (!s || s.length < 4) {
      toast.error("Subject is too short");
      return;
    }
    if (!b || b.length < 10) {
      toast.error("Add more detail to your message");
      return;
    }
    try {
      await create.mutateAsync({ subject: s, body: b });
      toast.success("Ticket created — we'll respond soon");
      setOpen(false);
      setSubject("");
      setBody("");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="container max-w-4xl space-y-10 py-10">
      <header className="space-y-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <HelpCircle className="h-3.5 w-3.5" /> Help center
        </span>
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">
          How can we help?
        </h1>
        <p className="text-sm text-muted-foreground">
          Search our knowledge base or open a ticket — we usually reply within a
          few hours.
        </p>
        <div className="relative mx-auto max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the knowledge base..."
            className="h-11 rounded-full bg-secondary pl-10"
          />
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold">
          Frequently asked
        </h2>
        {faqLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">
            No matching articles. Open a ticket below.
          </Card>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="w-full rounded-2xl border border-border bg-card px-2"
          >
            {filtered.map((f) => (
              <AccordionItem key={f._id} value={f._id} className="px-2">
                <AccordionTrigger className="text-left text-sm font-semibold">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="whitespace-pre-wrap text-sm text-foreground/80">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Your tickets</h2>
          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full">
                  <Plus className="mr-1 h-4 w-4" /> New ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Open a support ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={120}
                  />
                  <Textarea
                    placeholder="Describe your issue..."
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={2000}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submit} disabled={create.isPending}>
                    {create.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}{" "}
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!user ? (
          <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary">
              Sign in
            </Link>{" "}
            to open a support ticket.
          </Card>
        ) : ticketsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">
            No tickets yet — questions are welcome anytime.
          </Card>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <Link
                key={t._id}
                to={`/marketplace/support/${t._id}`}
                className="block"
              >
                <Card className="rounded-2xl p-4 transition-base hover:border-primary/50 hover:shadow-glow">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-1 h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{t.subject}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {t.body}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={STATUS_TONE[t.status]}
                      >
                        {t.status}
                      </Badge>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDate(t.updatedAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Support;
