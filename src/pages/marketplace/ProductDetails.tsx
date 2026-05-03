import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MapPin, MessageCircle, Plus, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { useProduct } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiErrorMessage } from "@/lib/api";
import { formatNaira, initials } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const { data: product, isLoading, isError } = useProduct(id);
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [placing, setPlacing] = useState(false);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }
  if (isError || !product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Product not found</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/marketplace"><ChevronLeft className="mr-1 h-4 w-4" /> Back to marketplace</Link>
        </Button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : ["/placeholder.svg"];
  const total = product.price * quantity;

  const addToCart = (goCheckout = false) => {
    if (!user) { navigate("/login"); return; }
    add(product, quantity);
    if (goCheckout) {
      navigate("/marketplace/checkout");
    } else {
      toast.success(`${product.title} added to cart`, {
        action: { label: "View cart", onClick: () => navigate("/marketplace/cart") },
      });
    }
  };

  const buyNow = async () => {
    if (!user) { navigate("/login"); return; }
    setPlacing(true);
    try {
      add(product, quantity);
      navigate("/marketplace/checkout");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  const contactSeller = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      const { data } = await api.post("/conversations", {
        recipientId: product.farmer?._id,
        productId: product._id ?? product.id,
      });
      const cid = (data as { _id?: string; id?: string })._id ?? (data as { id?: string }).id;
      navigate(`/marketplace/messages${cid ? `?conversation=${cid}` : ""}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="container py-8">
      <Link to="/marketplace" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-secondary shadow-card">
            <img src={images[activeImg]} alt={product.title} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-thin">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={
                    "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-base " +
                    (activeImg === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")
                  }
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            {product.category && (
              <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                {product.category}
              </span>
            )}
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">{product.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{product.state ?? product.farmer?.state ?? "Nigeria"}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-soft p-6 shadow-card">
            <p className="font-display text-4xl font-extrabold text-primary">
              {formatNaira(product.price)}
              {product.unit && <span className="ml-1 text-base font-medium text-muted-foreground">/ {product.unit}</span>}
            </p>
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-foreground/80">{product.description}</p>
          )}

          {product.farmer && (
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={product.farmer.avatar} alt={product.farmer.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">{initials(product.farmer.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{product.farmer.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3 w-3 text-primary" /> Verified seller</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={contactSeller} className="rounded-full">
                <MessageCircle className="mr-1 h-4 w-4" /> Contact
              </Button>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-border p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
              </div>
              <div className="space-y-1.5">
                <Label>Total</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-secondary px-3 font-semibold text-primary">
                  {formatNaira(total)}
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => addToCart(false)} className="h-11 rounded-full text-base font-semibold">
                <Plus className="mr-2 h-4 w-4" /> Add to cart
              </Button>
              <Button onClick={buyNow} disabled={placing} className="h-11 rounded-full bg-gradient-primary text-base font-semibold shadow-glow">
                <Zap className="mr-2 h-4 w-4" /> {placing ? "..." : "Pay now"}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              <ShoppingBag className="mr-1 inline h-3 w-3" />
              Choose delivery address & method at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
