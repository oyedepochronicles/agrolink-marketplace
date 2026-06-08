import { AnnouncementBannerSwiper } from "@/components/AnnouncementBannerSwipper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnnouncement,
  useAnnouncements,
  useDismissAnnouncement,
} from "@/hooks/useAnnouncements";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Pin, X } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const AnnouncementDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: list } = useAnnouncements();
  const cached = useMemo(() => list?.find((a) => a._id === id), [list, id]);
  const { data: fetched, isLoading } = useAnnouncement(id);
  const dismiss = useDismissAnnouncement();

  const a = fetched ?? cached;

  if (isLoading && !a) {
    return (
      <div className="container max-w-3xl px-4 py-6 md:py-10">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-56 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-8 w-3/4" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>
    );
  }

  if (!a) {
    return (
      <div className="container max-w-3xl px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Announcement not found.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/announcements">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to announcements
          </Link>
        </Button>
      </div>
    );
  }

  const time = new Date(a.publishedAt ?? a.createdAt);

  return (
    <div className="container max-w-3xl px-4 py-6 md:py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <article className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        {a.banner?.length ? (
          <AnnouncementBannerSwiper
            images={a.banner}
            rounded="rounded-none"
            height="h-52 sm:h-72 md:h-96"
          />
        ) : null}

        <div className="p-5 md:p-8">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="rounded-full">
              {a.type}
            </Badge>
            {a.isPinned && (
              <Badge variant="outline" className="gap-1 rounded-full">
                <Pin className="h-3 w-3" /> Pinned
              </Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {Number.isNaN(time.getTime()) ? "" : format(time, "PPp")}
            </span>
          </div>

          <h1
            className={cn(
              "mt-3 font-display text-2xl font-extrabold leading-tight md:text-4xl",
            )}
          >
            {a.title}
          </h1>

          <div className="prose prose-sm md:prose-base mt-4 max-w-none whitespace-pre-line text-foreground/85">
            {a.message}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {a.actionLink && a.actionLabel && (
              <Button
                asChild
                className="rounded-full bg-gradient-primary shadow-glow"
              >
                <a href={a.actionLink} target="_blank" rel="noreferrer">
                  {a.actionLabel} <ExternalLink className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            )}
            {a.dismissible !== false && (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  dismiss.mutate(a._id);
                  navigate("/announcements");
                }}
              >
                <X className="mr-1.5 h-4 w-4" /> Dismiss
              </Button>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};

export default AnnouncementDetails;
