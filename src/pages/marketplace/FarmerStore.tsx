import { ProductCard } from "@/components/marketplace/ProductCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useFarmer,
  useFarmerReviews,
  type FarmerReview,
} from "@/hooks/useFarmers";
import { usePageMeta } from "@/hooks/usePageMeta";
import { formatDate, initials } from "@/lib/format";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Sprout,
  Star,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const FarmerStore = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useFarmer(id);
  const { data: reviews = [] } = useFarmerReviews(id);

  const farmer = data?.farmer;
  const products = data?.products ?? [];
  const profile = farmer?.farmerProfile;

  usePageMeta({
    title: farmer ? `${farmer.name} — PhyhanAgro` : "Farmer store — PhyhanAgro",
    description: farmer
      ? `Buy fresh produce directly from ${farmer.name}${
          profile?.farmName ? ` (${profile.farmName})` : ""
        } on PhyhanAgro.`
      : "Verified farmer storefront on PhyhanAgro.",
    path: id ? `/marketplace/farmers/${id}` : "/marketplace/farmers",
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !farmer) {
    return (
      <div className="container py-16">
        <Card className="rounded-2xl p-12 text-center">
          <p className="font-semibold">Farmer not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This storefront may no longer be available.
          </p>
          <Link
            to="/marketplace/farmers"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to farmers
          </Link>
        </Card>
      </div>
    );
  }

  const place = [farmer.location?.lga, farmer.location?.state]
    .filter(Boolean)
    .join(", ");
  const farmAddress =
    profile?.farmAddress ||
    [profile?.farmLga, profile?.farmState].filter(Boolean).join(", ");

  return (
    <div className="container space-y-10 py-8">
      <Link
        to="/marketplace/farmers"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All farmers
      </Link>

      {/* Storefront header */}
      <Card className="overflow-hidden rounded-3xl">
        {profile?.farmPhotoUrl && (
          <div className="aspect-[16/5] w-full overflow-hidden bg-secondary">
            <img
              src={profile.farmPhotoUrl}
              alt={profile.farmName || farmer.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 border-4 border-background shadow-elegant">
            <AvatarImage src={farmer.profileImage} alt={farmer.name} />
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
              {initials(farmer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                {farmer.name}
              </h1>
              {farmer.verificationStatus === "approved" && (
                <Badge className="gap-1 border-transparent bg-primary/10 text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </Badge>
              )}
            </div>
            {profile?.farmName && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Sprout className="h-4 w-4 text-primary" /> {profile.farmName}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {(farmAddress || place) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {farmAddress || place}
                </span>
              )}
              {(profile?.farmPhone || farmer.phone) && (
                <a
                  href={`tel:${profile?.farmPhone || farmer.phone}`}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Phone className="h-4 w-4" /> {profile?.farmPhone || farmer.phone}
                </a>
              )}
              {typeof farmer.avgRating === "number" && farmer.avgRating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {farmer.avgRating.toFixed(1)}
                  {farmer.ratingsCount ? ` · ${farmer.ratingsCount} reviews` : ""}
                </span>
              )}
            </div>
            {profile?.farmLandmark && (
              <p className="text-xs text-muted-foreground">
                Landmark: {profile.farmLandmark}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Products */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">
            Products{" "}
            <span className="text-base font-medium text-muted-foreground">
              ({products.length})
            </span>
          </h2>
        </div>
        {products.length === 0 ? (
          <Card className="rounded-2xl p-10 text-center text-sm text-muted-foreground">
            This farmer has no listings available right now.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p._id}
                product={{ ...p, title: p.title ?? p.name }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold">
            Reviews{" "}
            <span className="text-base font-medium text-muted-foreground">
              ({reviews.length})
            </span>
          </h2>
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewRow key={review._id} review={review} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const ReviewRow = ({ review }: { review: FarmerReview }) => (
  <Card className="rounded-2xl p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-secondary text-xs font-semibold">
            {initials(review.buyerId?.name || "Buyer")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">
            {review.buyerId?.name || "Verified buyer"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(review.createdAt)}
            {review.productId?.name ? ` · ${review.productId.name}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              i < review.rating
                ? "h-4 w-4 fill-warning text-warning"
                : "h-4 w-4 text-muted-foreground/30"
            }
          />
        ))}
      </div>
    </div>
    {review.comment && (
      <p className="mt-3 text-sm text-foreground/90">{review.comment}</p>
    )}
    {review.reply?.body && (
      <>
        <Separator className="my-3" />
        <div className="rounded-lg bg-secondary/60 p-3">
          <p className="text-xs font-semibold text-primary">Farmer response</p>
          <p className="mt-1 text-sm text-foreground/90">{review.reply.body}</p>
        </div>
      </>
    )}
  </Card>
);

export default FarmerStore;
