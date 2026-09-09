import { Brand } from "@/components/Brand";
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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { SearchPalette } from "./SearchPalette";

const useNavItems = () => {
  const { t } = useTranslation();
  return [
    { to: "/marketplace", label: t("nav.home") },
    { to: "/marketplace/search", label: t("nav.browse") },
    { to: "/marketplace/orders", label: t("nav.orders") },
    { to: "/announcements", label: t("nav.announcements", "Announcements") },
    { to: "/marketplace/support", label: t("nav.support", "Support") },
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
  const routerLocation = useLocation();
  const navItems = useNavItems();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global keyboard shortcut: ⌘K / Ctrl+K opens the search palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [routerLocation.pathname]);

  const openPalette = () => {
    setMobileOpen(false);
    setPaletteOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center gap-4">
        <Brand />

        <button
          type="button"
          onClick={openPalette}
          className="ml-4 hidden h-10 max-w-xl flex-1 items-center gap-2 rounded-full border border-border bg-secondary px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 md:flex"
        >
          <Search className="h-4 w-4" />
          <span className="truncate">{t("common.search") + " or navigate…"}</span>
          <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium lg:inline">
            ⌘K
          </kbd>
        </button>


        <nav className="ml-auto hidden items-center gap-1 lg:flex">
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
          <LanguageSwitcher className="hidden md:block" />
          <Link
            to="/marketplace/cart"
            aria-label={t("nav.cart")}
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
                  <UserIcon className="mr-2 h-4 w-4" /> {t("nav.profile")}
                </DropdownMenuItem>
                {user.role !== "buyer" && (
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        `/dashboard/${user.role === "super_admin" ? "admin" : user.role}`,
                      )
                    }
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />{" "}
                    {t("nav.backToDashboard")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/marketplace/cart")}>
                  <ShoppingBag className="mr-2 h-4 w-4" /> {t("nav.cart")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/marketplace/support")}
                >
                  <HelpCircle className="mr-2 h-4 w-4" /> {t("nav.support")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.signOut")}
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
                {t("nav.signIn")}
              </Button>
              <Button
                onClick={() => navigate("/register")}
                className="rounded-full bg-gradient-primary shadow-glow"
              >
                {t("nav.getStarted")}
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
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
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container space-y-3 py-4">
            <button
              type="button"
              onClick={openPalette}
              className="relative flex h-11 w-full items-center gap-2 rounded-full bg-secondary px-4 text-left text-sm text-muted-foreground md:hidden"
            >
              <Search className="h-4 w-4" />
              <span className="truncate">{t("common.search") + " or navigate…"}</span>
            </button>
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

              <LanguageSwitcher className="md:hidden" />

              {!user && (
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    asChild
                  >
                    <Link to="/login">{t("nav.signIn")}</Link>
                  </Button>
                  <Button
                    className="flex-1 rounded-full bg-gradient-primary"
                    asChild
                  >
                    <Link to="/register">{t("nav.getStarted")}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <SearchPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
};
