import { Brand } from "@/components/Brand";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  User as UserIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useNavigate } from "react-router-dom";

const useNavItems = () => {
  const { t } = useTranslation();
  return [
    { to: "/marketplace", label: t("nav.home") },
    { to: "/marketplace/search", label: t("nav.browse") },
    { to: "/marketplace/orders", label: t("nav.orders") },
    { to: "/marketplace/messages", label: t("nav.messages") },
    { to: "/marketplace/profile", label: t("nav.profile") },
  ];
};

export const MarketplaceNavbar = ({
  onSearch,
}: {
  onSearch?: (q: string) => void;
}) => {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const navItems = useNavItems();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(q);
    else navigate(`/marketplace/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center gap-4">
        <Brand />

        <form
          onSubmit={submitSearch}
          className="ml-4 hidden flex-1 max-w-xl md:flex"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tomatoes, yam, palm oil..."
              className="h-10 rounded-full border-border bg-secondary pl-10 focus-visible:bg-background"
            />
          </div>
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/marketplace"}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-base hover:text-primary",
                  isActive ? "bg-secondary text-primary" : "text-foreground/70",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <Link
            to="/marketplace/cart"
            aria-label="Cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-glow">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
          {user && <NotificationsBell />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-base hover:bg-secondary">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline">
                    {user.name.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/marketplace/profile")}
                >
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                {user.role !== "buyer" && (
                  <DropdownMenuItem
                    onClick={() => navigate(`/dashboard/${user.role}`)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Back to
                    dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/marketplace/cart")}>
                  <ShoppingBag className="mr-2 h-4 w-4" /> Cart
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/marketplace/support")}
                >
                  <HelpCircle className="mr-2 h-4 w-4" /> Help center
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="rounded-full"
              >
                Sign in
              </Button>
              <Button
                onClick={() => navigate("/register")}
                className="rounded-full bg-gradient-primary shadow-glow"
              >
                Get started
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container space-y-3 py-4">
            <form onSubmit={submitSearch} className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search produce..."
                className="h-11 rounded-full bg-secondary pl-10"
              />
            </form>
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/marketplace"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-secondary text-primary"
                        : "text-foreground/80",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {!user && (
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    asChild
                  >
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button
                    className="flex-1 rounded-full bg-gradient-primary"
                    asChild
                  >
                    <Link to="/register">Get started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
