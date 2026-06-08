import { AnnouncementBannerSwiper } from "@/components/AnnouncementBannerSwipper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnnouncements,
  useDismissAnnouncement,
} from "@/hooks/useAnnouncements";
import { cn } from "@/lib/utils";
import type { AnnouncementType } from "@/types/announcement";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Info,
  Megaphone,
  Pin,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const TYPE_STYLES: Record<
  AnnouncementType | "CRITICAL",
  { icon: typeof Info; tone: string; chip: string }
> = {
  INFO: {
    icon: Info,
    tone: "text-primary bg-primary/10",
    chip: "bg-primary/10 text-primary border-primary/20",
  },
  WARNING: {
    icon: AlertTriangle,
    tone: "text-warning bg-warning/10",
    chip: "bg-warning/10 text-warning border-warning/30",
  },
  CRITICAL: {
    icon: AlertTriangle,
    tone: "text-destructive bg-destructive/10",
    chip: "bg-destructive/10 text-destructive border-destructive/30",
  },
  PROMOTION: {
    icon: Sparkles,
    tone: "text-accent bg-accent/10",
    chip: "bg-accent/10 text-accent border-accent/30",
  },
  UPDATE: {
    icon: Megaphone,
    tone: "text-primary bg-primary/10",
    chip: "bg-primary/10 text-primary border-primary/20",
  },
};

const FILTERS: { id: AnnouncementType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "INFO", label: "Info" },
  { id: "UPDATE", label: "Updates" },
  { id: "WARNING", label: "Warnings" },
  { id: "PROMOTION", label: "Promotions" },
];

const Announcements = () => {
  const { data = [], isLoading } = useAnnouncements();
  const dismiss = useDismissAnnouncement();
  const [filter, setFilter] = useState<AnnouncementType | "all">("all");

  const items = useMemo(() => {
    const visible = data.filter((a) => !a.isDismissed);
    const filtered =
      filter === "all" ? visible : visible.filter((a) => a.type === filter);
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
    <div className="container max-w-3xl px-4 py-6 md:py-10">
      {/* Header */}
      <header className="flex items-start gap-3 md:gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow md:h-12 md:w-12">
          <Megaphone className="h-5 w-5 md:h-6 md:w-6" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-extrabold leading-tight md:text-3xl">
            Announcements
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            Platform updates, alerts and promotions.
          </p>
        </div>
      </header>

      {/* Filter chips — horizontally scrollable on mobile */}
      <div className="-mx-4 mt-5 overflow-x-auto px-4 scrollbar-thin">
        <div className="flex w-max gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-base md:text-sm",
                filter === f.id
                  ? "border-primary bg-gradient-primary text-white shadow-card"
                  : "border-border bg-background text-foreground/70 hover:border-primary/40 hover:text-primary",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="mt-5 space-y-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}

        {!isLoading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-10 text-center text-sm text-muted-foreground">
            No announcements right now. You're all caught up.
          </div>
        )}

        {!isLoading &&
          items.map((a) => {
            const { icon: Icon, tone, chip } =
              TYPE_STYLES[a.type] ?? TYPE_STYLES.INFO;
            const time = new Date(a.publishedAt ?? a.createdAt);
            return (
              <article
                key={a._id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-base hover:shadow-card",
                  a.isPinned && "border-primary/40",
                )}
              >
                {a.banner?.length ? (
                  <Link to={`/announcements/${a._id}`} className="block">
                    <AnnouncementBannerSwiper
                      images={a.banner}
                      rounded="rounded-none"
                      height="h-40 sm:h-48"
                    />
                  </Link>
                ) : null}

                <div className="p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        tone,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("rounded-full text-[10px]", chip)}
                        >
                          {a.type}
                        </Badge>
                        {a.isPinned && (
                          <Badge
                            variant="outline"
                            className="gap-1 rounded-full text-[10px]"
                          >
                            <Pin className="h-2.5 w-2.5" /> Pinned
                          </Badge>
                        )}
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          {Number.isNaN(time.getTime())
                            ? ""
                            : formatDistanceToNow(time, { addSuffix: true })}
                        </span>
                      </div>

                      <Link to={`/announcements/${a._id}`}>
                        <h3 className="mt-1.5 font-display text-base font-bold leading-snug hover:underline md:text-lg">
                          {a.title}
                        </h3>
                      </Link>

                      <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-foreground/75">
                        {a.message}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Link
                          to={`/announcements/${a._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Read more <ArrowRight className="h-3 w-3" />
                        </Link>

                        <div className="flex items-center gap-1.5">
                          {a.actionLink && a.actionLabel && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-full px-3 text-xs"
                              asChild
                            >
                              <a
                                href={a.actionLink}
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
                              className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
};

export default Announcements;
