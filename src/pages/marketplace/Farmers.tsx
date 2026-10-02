import { ProductCard } from "@/components/marketplace/ProductCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFarmers, type DirectoryFarmer } from "@/hooks/useFarmers";
import { usePageMeta } from "@/hooks/usePageMeta";
import { initials } from "@/lib/format";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Sprout,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const Farmers = () => {
  usePageMeta({
    title: "Verified farmers — PhyhanAgro",
    description:
      "Browse verified farmers across Nigeria and shop fresh produce directly from their storefronts.",
    path: "/marketplace/farmers",
  });

  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setQ(term.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [term]);

  const { data, isLoading, isFetching } = useFarmers({ q, page, limit: 12 });
  const farmers = data?.items ?? [];
  const meta = data?.meta;
  const totalPages = meta?.pages ?? 1;

  return (
    <div className="container space-y-8 py-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sprout className="h-3.5 w-3.5" /> Verified farmers
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          Shop directly from Nigerian farms
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Every farmer here has passed PhyhanAgro verification. Explore their
          storefronts and buy fresh produce straight from the source.
        </p>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search farmers by name…"
            className="pl-9"
            aria-label="Search farmers"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : farmers.length === 0 ? (
        <Card className="rounded-2xl p-12 text-center">
          <p className="font-semibold">No farmers found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q
              ? `No verified farmers match "${q}".`
              : "Check back soon as more farmers get verified."}
          </p>
        </Card>
      ) : (
        <>
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy={isFetching}
          >
            {farmers.map((farmer) => (
              <FarmerCard key={farmer._id} farmer={farmer} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const FarmerCard = ({ farmer }: { farmer: DirectoryFarmer }) => {
  const place = useMemo(
    () =>
      [farmer.location?.lga, farmer.location?.state].filter(Boolean).join(", "),
    [farmer.location],
  );
  const farmName = farmer.farmerProfile?.farmName;

  return (
    <Link
      to={`/marketplace/farmers/${farmer._id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-spring hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={farmer.profileImage} alt={farmer.name} />
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {initials(farmer.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold">{farmer.name}</p>
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          </div>
          {farmName && (
            <p className="truncate text-xs text-muted-foreground">{farmName}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {place && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {place}
          </span>
        )}
        {typeof farmer.avgRating === "number" && farmer.avgRating > 0 && (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            {farmer.avgRating.toFixed(1)}
            {farmer.ratingsCount ? ` (${farmer.ratingsCount})` : ""}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        <Badge
          variant="outline"
          className="border-transparent bg-primary/10 text-primary"
        >
          Verified farm
        </Badge>
        <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
          Visit store →
        </span>
      </div>
    </Link>
  );
};

export default Farmers;
