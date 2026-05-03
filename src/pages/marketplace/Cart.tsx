import { Link, useNavigate } from "react-router-dom";
import { Minus, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";

const Cart = () => {
  const { items, update, remove, subtotal, count } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-secondary/30 p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Browse fresh produce from verified farmers and add items to your cart.</p>
          <Button asChild className="mt-6 rounded-full bg-gradient-primary shadow-glow">
            <Link to="/marketplace">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">Your cart</h1>
      <p className="text-sm text-muted-foreground">{count} {count === 1 ? "item" : "items"}</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
              <button
                onClick={() => navigate(`/marketplace/product/${i.productId}`)}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary"
              >
                {i.image ? <img src={i.image} alt={i.title} className="h-full w-full object-cover" /> : <Package className="m-6 h-8 w-8 text-muted-foreground" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{i.title}</p>
                {i.farmerName && <p className="text-xs text-muted-foreground">by {i.farmerName}</p>}
                <p className="mt-1 font-display text-base font-extrabold text-primary">
                  {formatNaira(i.price)}{i.unit ? <span className="text-xs font-medium text-muted-foreground"> /{i.unit}</span> : null}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-border">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => update(i.productId, i.quantity - 1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => update(i.productId, i.quantity + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(i.productId)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
              <p className="hidden shrink-0 self-center text-sm font-bold sm:block">{formatNaira(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-bold">Order summary</h3>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatNaira(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Delivery calculated at checkout.</p>
            <Button
              onClick={() => navigate("/marketplace/checkout")}
              className="mt-5 h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow"
            >
              Proceed to checkout
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
              <Link to="/marketplace">Continue shopping</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
