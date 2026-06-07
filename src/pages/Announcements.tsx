import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAnnouncements,
  useDismissAnnouncement,
} from "@/hooks/useAnnouncements";
import { cn } from "@/lib/utils";
import type { AnnouncementType } from "@/types/announcement";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Info, Megaphone, Pin, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

const TYPE_STYLES: Record<
  AnnouncementType,
  { icon: typeof Info; tone: string }
> = {
  info: { icon: Info, tone: "text-primary bg-primary/10" },
  warning: { icon: AlertTriangle, tone: "text-warning bg-warning/10" },
  critical: {
    icon: AlertTriangle,
    tone: "text-destructive bg-destructive/10",
  },
  promotion: { icon: Sparkles, tone: "text-accent bg-accent/10" },
  update: { icon: Megaphone, tone: "text-primary bg-primary/10" },
};

const FILTERS: { id: AnnouncementType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "info", label: "Info" },
  { id: "update", label: "Updates" },
  { id: "warning", label: "Warnings" },
  { id: "promotion", label: "Promotions" },
];

const Announcements = () => {
  const { data = [], isLoading } = useAnnouncements();
  const dismiss = useDismissAnnouncement();
  const [filter, setFilter] = useState<AnnouncementType | "all">("all");

  const items = useMemo(() => {
    const visible = data.filter((a) => !a.isDismissed);
    const filtered =
      filter === "all"
        ? visible
        : visible.filter((a) => a.type === filter.toUpperCase());
    return [...filtered].sort((a, b) => {
      if ((b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) !== 0)
        return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      return (
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime()
      );
    });
  }, [data, filter]);

  return (
    <div className="container max-w-3xl py-8">
      <header className="flex items-start gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow">
          <Megaphone className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground">
            Platform updates, alerts and promotions — your primary news source.
          </p>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-10 text-center text-sm text-muted-foreground">
            No announcements right now. You're all caught up.
          </div>
        ) : (
          items.map((a) => {
            const { icon: Icon, tone } =
              TYPE_STYLES[a.type] ?? TYPE_STYLES.info;
            const time = new Date(a.publishedAt ?? a.createdAt);
            return (
              <article
                key={a._id}
                className={cn(
                  "rounded-2xl border border-border bg-card p-5 shadow-card",
                  a.isPinned && "border-primary/40",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      tone,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold">
                        {a.title}
                      </h3>
                      {a.isPinned && (
                        <Badge variant="outline" className="gap-1 rounded-full">
                          <Pin className="h-3 w-3" /> Pinned
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="rounded-full capitalize"
                      >
                        {a.type}
                      </Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-foreground/80">
                      {a.message}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {Number.isNaN(time.getTime())
                          ? ""
                          : formatDistanceToNow(time, { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-2">
                        {a.actionUrl && a.actionLabel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            asChild
                          >
                            <a
                              href={a.actionUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {a.actionLabel}
                            </a>
                          </Button>
                        )}
                        {a.dismissible !== false && (
                          <button
                            type="button"
                            aria-label="Dismiss"
                            onClick={() => dismiss.mutate(a._id)}
                            className="rounded-full p-1 hover:bg-secondary"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Announcements;
