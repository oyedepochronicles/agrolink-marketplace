import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const Cart = () => (
  <div className="container py-16">
    <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-secondary/30 p-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow">
        <ShoppingBag className="h-6 w-6" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-extrabold">Single-item checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        For now, PhyhanAgro orders are placed one product at a time directly from the product page. A multi-item cart is coming soon.
      </p>
      <Button asChild className="mt-6 rounded-full bg-gradient-primary shadow-glow">
        <Link to="/marketplace">Browse products</Link>
      </Button>
    </div>
  </div>
);

export default Cart;
