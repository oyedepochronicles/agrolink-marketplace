import { RatingStars } from "@/components/RatingStars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateReview,
  useProductRating,
  useProductReviews,
  useReplyToReview,
} from "@/hooks/useReviews";
import { apiErrorMessage } from "@/lib/api";
import { initials } from "@/lib/format";
import { Loader2, MessageSquare, Reply } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  productId: string;
  farmerId?: string;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

export const ProductReviews = ({ productId, farmerId }: Props) => {
  const { user } = useAuth();
  const { data: summary } = useProductRating(productId);
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const create = useCreateReview(productId);
  const reply = useReplyToReview(productId);

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const isFarmer = user?.role === "farmer" && user?._id === farmerId;
  const canReview = !!user && user?._id !== farmerId;

  const submit = async () => {
    if (!rating) {
      toast.error("Pick a star rating");
      return;
    }
    try {
      await create.mutateAsync({ rating, body: body.trim() || undefined });
      setRating(0);
      setBody("");
      toast.success("Review posted");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };
  console.log(reviews);
  const submitReply = async (reviewId: string) => {
    const text = replyBody.trim();
    if (!text) return;
    try {
      await reply.mutateAsync({ reviewId, body: text });
      setReplyOpen(null);
      setReplyBody("");
      toast.success("Reply posted");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <section id="reviews" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Reviews</h2>
          <div className="mt-1 flex items-center gap-2">
            <RatingStars value={summary?.average ?? 0} size="lg" />
            <span className="text-sm font-semibold">
              {(summary?.average ?? 0).toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              · {summary?.count ?? 0} review
              {(summary?.count ?? 0) === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      {canReview && (
        <Card className="rounded-2xl p-4 shadow-card">
          <p className="mb-2 text-sm font-semibold">Share your experience</p>
          <RatingStars value={rating} onChange={setRating} size="lg" />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you think of the product?"
            rows={3}
            maxLength={1000}
            className="mt-3"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={submit} disabled={create.isPending || !rating}>
              {create.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Post review
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No reviews yet — be the first to share your experience.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r._id} className="rounded-2xl p-4 shadow-card">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={r.buyerId?.profileImage}
                    alt={r.buyerId?.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {initials(r.buyerId?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      {r.buyerId?.name ?? "Buyer"}
                    </p>
                    <RatingStars value={r.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      · {formatDate(r.createdAt)}
                    </span>
                  </div>
                  {r.body && (
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">
                      {r.body}
                    </p>
                  )}

                  {r.reply ? (
                    <div className="mt-3 rounded-xl border-l-2 border-primary/60 bg-secondary px-3 py-2">
                      <p className="text-xs font-semibold text-primary">
                        Farmer reply · {formatDate(r.reply.createdAt)}
                      </p>
                      <p className="mt-0.5 text-sm">{r.reply.body}</p>
                    </div>
                  ) : isFarmer ? (
                    <div className="mt-2">
                      {replyOpen === r._id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            rows={2}
                            maxLength={500}
                            placeholder="Write a reply..."
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReplyOpen(null);
                                setReplyBody("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => submitReply(r._id)}
                              disabled={reply.isPending || !replyBody.trim()}
                            >
                              Post reply
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyOpen(r._id);
                            setReplyBody("");
                          }}
                        >
                          <Reply className="mr-1 h-3.5 w-3.5" /> Reply
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!user && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          <MessageSquare className="h-4 w-4" /> Sign in as a buyer to leave a
          review.
        </div>
      )}
    </section>
  );
};
