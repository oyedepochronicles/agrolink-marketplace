import heroImage from "@/assets/marketplace-hero.jpg";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useProducts } from "@/hooks/useProducts";
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const categories = [
  { label: "All", value: "All" },
  { label: "Vegetables", value: "Vegetable" },
  { label: "Fruits", value: "Fruit" },
  { label: "Grains", value: "Grain" },
  { label: "Tubers", value: "Tuber" },
  { label: "Livestock", value: "Other" },
  { label: "Dairy", value: "Other" },
  { label: "Spices", value: "Other" },
];

const MarketplaceHome = () => {
  const [activeCat, setActiveCat] = useState("All");
  const {
    data: products,
    isLoading,
    isError,
  } = useProducts(activeCat === "All" ? {} : { category: activeCat });

  const featured = useMemo(() => products?.slice(0, 8) ?? [], [products]);
  const fresh = useMemo(() => products?.slice(8, 20) ?? [], [products]);

  usePageMeta({
    title: "Fresh Farm Produce Marketplace | PhyhanAgro",
    description:
      "Shop fresh produce from verified Nigerian farms, chat with sellers in real time, and get local delivery across Nigeria.",
    path: "/marketplace",
    image: "/og-image.svg",
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            width={1600}
            height={1024}
          />
          <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        </div>
        <div className="container relative grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fade-in-up space-y-6 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Direct from farm
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Fresh harvests,
              <br />
              <span className="bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
                delivered fast.
              </span>
            </h1>
            <p className="max-w-lg text-base text-white/80 md:text-lg">
              Shop verified Nigerian farms, talk to sellers in real time, and
              get your order delivered by trusted riders — all on PhyhanAgro.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-primary-deep shadow-glow hover:bg-white/90"
              >
                <Link to="/marketplace/search">
                  Browse marketplace <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <Link to="/affiliate">Sell on PhyhanAgro</Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <Stat value="500+" label="Verified farms" />
              <Stat value="36" label="States covered" />
              <Stat value="24/7" label="Live chat" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container grid gap-6 py-8 md:grid-cols-3">
          <Trust
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Verified farmers"
            desc="Every seller is vetted by our team."
          />
          <Trust
            icon={<Truck className="h-5 w-5" />}
            title="Fast delivery"
            desc="Trusted riders across all 36 states."
          />
          <Trust
            icon={<MessageCircle className="h-5 w-5" />}
            title="Real-time chat"
            desc="Talk to sellers before you buy."
          />
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              Shop by category
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick a category to explore fresh listings.
            </p>
          </div>
          <Link
            to="/marketplace/search"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCat(cat.value)}
              className={
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-base " +
                (activeCat === cat.value
                  ? "border-primary bg-gradient-primary text-white shadow-card"
                  : "border-border bg-background hover:border-primary/40 hover:text-primary")
              }
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Featured grid */}
      <section className="container pb-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
            Featured listings
          </h2>
        </div>
        {isLoading && <ProductGridSkeleton count={8} />}
        {isError && (
          <div className="rounded-2xl border border-border bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
            Couldn't load products. Make sure the API is running at{" "}
            <code className="font-mono">localhost:5000</code>.
          </div>
        )}
        {!isLoading && !isError && featured.length === 0 && <EmptyState />}
        {!isLoading && featured.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p._id ?? p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Fresh today */}
      {fresh.length > 0 && (
        <section className="container pb-20">
          <h2 className="mb-6 font-display text-xl font-extrabold tracking-tight md:text-2xl">
            Fresh today
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {fresh.map((p) => (
              <ProductCard key={p._id ?? p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container pb-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-primary p-10 text-white shadow-elegant md:p-14">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
                Are you a farmer?
                <br />
                Reach buyers across Nigeria.
              </h3>
              <p className="mt-3 max-w-md text-white/85">
                List your harvest in minutes. We handle payments, chat, and
                delivery logistics.
              </p>
            </div>
            <div className="md:justify-self-end">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-primary-deep hover:bg-white/90"
              >
                <Link to="/affiliate">
                  Apply as farmer <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <p className="font-display text-2xl font-extrabold">{value}</p>
    <p className="text-xs uppercase tracking-wider text-white/70">{label}</p>
  </div>
);

const Trust = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex items-start gap-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      {icon}
    </span>
    <div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  </div>
);

const ProductGridSkeleton = ({ count }: { count: number }) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-12 text-center">
    <p className="font-semibold">No products yet</p>
    <p className="mt-1 text-sm text-muted-foreground">
      Check back soon — farmers are listing fresh produce daily.
    </p>
  </div>
);

export default MarketplaceHome;
