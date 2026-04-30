import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["all", "vegetables", "fruits", "grains", "tubers", "livestock", "dairy", "spices"];
const STATES = ["all", "Lagos", "Oyo", "Kano", "Rivers", "Kaduna", "Plateau", "Enugu", "Ogun", "Anambra", "Edo"];

const MarketplaceSearch = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "all");
  const [state, setState] = useState(params.get("state") ?? "all");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category !== "all") p.set("category", category);
    if (state !== "all") p.set("state", state);
    if (maxPrice) p.set("maxPrice", maxPrice);
    setParams(p, { replace: true });
  }, [q, category, state, maxPrice, setParams]);

  const filters = useMemo(() => ({
    q: q || undefined,
    category: category !== "all" ? category : undefined,
    state: state !== "all" ? state : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  }), [q, category, state, maxPrice]);

  const { data: products, isLoading, isError } = useProducts(filters);

  const filtered = useMemo(() => {
    if (!products || !q) return products ?? [];
    const needle = q.toLowerCase();
    return products.filter((p) =>
      p.title.toLowerCase().includes(needle) ||
      p.description?.toLowerCase().includes(needle) ||
      p.category?.toLowerCase().includes(needle),
    );
  }, [products, q]);

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Browse the marketplace</h1>
          <p className="text-sm text-muted-foreground">Filter by category, state, and price.</p>
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
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All categories" : c[0].toUpperCase() + c.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              {STATES.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All states" : s}</SelectItem>)}
            </SelectContent>
          </Select>
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
          onClick={() => { setQ(""); setCategory("all"); setState("all"); setMaxPrice(""); }}
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
          <p className="mt-1 text-sm text-muted-foreground">Try a different keyword or clear your filters.</p>
        </div>
      )}
      {!isLoading && filtered.length > 0 && (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p._id ?? p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
};

export default MarketplaceSearch;
