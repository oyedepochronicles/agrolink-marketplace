import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/format";
import {
  Bell,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Package,
  Search as SearchIcon,
  ShoppingBag,
  ShoppingCart,
  Store,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface SearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchPalette = ({ open, onOpenChange }: SearchPaletteProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const trimmed = q.trim();
  const { data: products, isFetching } = useProducts(
    trimmed.length >= 2 ? { q: trimmed, limit: 6 } : {},
  );

  const productMatches = useMemo(() => {
    if (trimmed.length < 2) return [];
    return (products ?? []).slice(0, 6);
  }, [products, trimmed]);

  const navItems = useMemo(() => {
    const base = [
      { label: "Home", to: "/marketplace", icon: Store },
      { label: "Browse all products", to: "/marketplace/search", icon: SearchIcon },
      { label: "Cart", to: "/marketplace/cart", icon: ShoppingCart },
      { label: "My orders", to: "/marketplace/orders", icon: Package },
      { label: "Announcements", to: "/announcements", icon: Bell },
      { label: "Messages", to: "/marketplace/messages", icon: MessageSquare },
      { label: "Support", to: "/marketplace/support", icon: HelpCircle },
    ];
    if (user) {
      base.push({ label: "Profile", to: "/marketplace/profile", icon: UserIcon });
      if (user.role !== "buyer") {
        const r = user.role === "super_admin" ? "admin" : user.role;
        base.push({
          label: "Go to dashboard",
          to: `/dashboard/${r}`,
          icon: LayoutDashboard,
        });
      }
    } else {
      base.push({ label: "Sign in", to: "/login", icon: LogIn });
      base.push({ label: "Get started", to: "/register", icon: ShoppingBag });
    }
    return base;
  }, [user]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  const runSearch = () => {
    onOpenChange(false);
    navigate(
      `/marketplace/search${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ""}`,
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={q}
        onValueChange={setQ}
        placeholder="Search products or jump to a page…"
      />
      <CommandList>
        <CommandEmpty>
          {isFetching ? "Searching…" : "No matches. Press Enter to search anyway."}
        </CommandEmpty>

        {trimmed && (
          <CommandGroup heading="Search">
            <CommandItem value={`__search__${trimmed}`} onSelect={runSearch}>
              <SearchIcon className="mr-2 h-4 w-4" />
              Search for "{trimmed}"
            </CommandItem>
          </CommandGroup>
        )}

        {productMatches.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Products">
              {productMatches.map((p) => {
                const id = p._id ?? p.id;
                const title = p.title ?? p.name ?? "Product";
                return (
                  <CommandItem
                    key={id}
                    value={`product-${id}-${title}`}
                    onSelect={() => go(`/marketplace/product/${id}`)}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{title}</span>
                    {typeof p.price === "number" && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatPrice(p.price)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Navigate">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.to}
                value={`nav-${item.label}`}
                onSelect={() => go(item.to)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
