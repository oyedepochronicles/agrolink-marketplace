import { ProductCard } from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { useCurrentLocation } from "@/hooks/useLocation";
import { useProductsPaged } from "@/hooks/useProducts";
import { NIGERIAN_STATES } from "@/lib/nigerianLocations";
import { Pager } from "@/pages/marketplace/MarketplaceHome";
import { Loader2, Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const CATEGORIES = [
  { label: "All categories", value: "all" },
  { label: "Vegetables", value: "Vegetable" },
  { label: "Fruits", value: "Fruit" },
  { label: "Grains", value: "Grain" },
  { label: "Tubers", value: "Tuber" },
  { label: "Livestock", value: "Other" },
  { label: "Dairy", value: "Other" },
  { label: "Spices", value: "Other" },
];
const STATES = ["all", ...NIGERIAN_STATES];

const MarketplaceSearch = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "all");
  const [state, setState] = useState(params.get("state") ?? "all");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const [location, setLocation] = useState("anywhere");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [page, setPage] = useState(Number(params.get("page") ?? "1") || 1);
  const PAGE_SIZE = 12;
  const { location: currentLocation, loading: locating, error } = useCurrentLocation();

  useEffect(() => {
    if (location !== "nearby") {
      setGeo(null);
      return;
    }
    if (locating) return;
    if (error) {
      toast.error("Couldn't access your location. Please allow location access or try again.");
      setGeo(null);
      setLocation("anywhere");
      return;
    }
    if (
      typeof currentLocation.lat === "number" &&
      typeof currentLocation.lng === "number"
    ) {
      setGeo({ lat: currentLocation.lat, lng: currentLocation.lng });
    }
  }, [location, locating, error, currentLocation.lat, currentLocation.lng]);

  // Reset to first page on filter change
  useEffect(() => {
    setPage(1);
  }, [q, category, state, minPrice, maxPrice, geo?.lat, geo?.lng]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category !== "all") p.set("category", category);
    if (state !== "all") p.set("state", state);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (geo?.lat) p.set("lat", geo.lat.toString());
    if (geo?.lng) p.set("lng", geo.lng.toString());
    if (page > 1) p.set("page", String(page));
    setParams(p, { replace: true });
  }, [q, category, state, minPrice, maxPrice, setParams, geo, page]);

  const filters = useMemo(
    () => ({
      q: q || undefined,
      category: category !== "all" ? category : undefined,
      state: state !== "all" ? state : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      nearLat: geo?.lat,
      nearLng: geo?.lng,
      page,
      limit: PAGE_SIZE,
    }),
    [q, category, state, minPrice, maxPrice, geo, page],
  );

  const { data: paged, isLoading, isError, isFetching } = useProductsPaged(filters);
  const products = paged?.items ?? [];
  const totalPages = paged?.totalPages ?? 1;

  const filtered = useMemo(() => {
    if (!products || !q) return products ?? [];
    const needle = q.toLowerCase();
    return products.filter(
      (p) =>
        (p.title ?? p.name ?? "").toLowerCase().includes(needle) ||
        p.description?.toLowerCase().includes(needle) ||
        p.category?.toLowerCase().includes(needle),
    );
  }, [products, q]);


  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Browse the marketplace
          </h1>
          <p className="text-sm text-muted-foreground">
            Filter by category, state, and price.
          </p>
        </div>
        <div className="relative w-full md:max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search produce..."
            className="h-11 rounded-full bg-secondary pl-10"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </div>
        <div className="grid flex-1 gap-3 md:grid-cols-5">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="NearBy" />
            </SelectTrigger>
            <SelectContent>
              {["anywhere", "nearby"].map((c, index) => (
                <SelectItem key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c, index) => (
                <SelectItem key={`${c.value}-${index}`} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger>
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All states" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max price (₦)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setQ("");
            setCategory("all");
            setState("all");
            setMinPrice("");
            setMaxPrice("");
            setLocation("anywhere");
          }}
          className="rounded-full"
        >
          Clear
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}
      {isError && (
        <div className="rounded-2xl border border-border bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
          Couldn't load products. Make sure the API is running.
        </div>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-semibold">No matching products</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different keyword or clear your filters.
          </p>
        </div>
      )}
      {!isLoading && filtered.length > 0 && (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p._id ?? p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MarketplaceSearch;
