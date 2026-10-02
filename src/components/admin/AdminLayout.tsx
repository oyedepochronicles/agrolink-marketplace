import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/format";
import { hasPermission, isAdmin, isSuperAdmin, mfaSatisfied } from "@/lib/authz";
import { cn } from "@/lib/utils";
import {
  Banknote,
  BarChart3,
  Bell,
  Briefcase,
  FileClock,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  LineChart,
  LogOut,
  Menu,
  PackageCheck,
  Receipt,
  Recycle,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  UserCog,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

interface Entry {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
  adminOnly?: boolean;
  permission?: string;
}

const NAV: Entry[] = [
  { to: "/admin", labelKey: "admin.nav.overview", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/admin/orders", labelKey: "admin.nav.orders", icon: <ShoppingCart className="h-4 w-4" />, permission: "orders:read" },
  { to: "/admin/products", labelKey: "admin.nav.productReview", icon: <PackageCheck className="h-4 w-4" />, permission: "products:review" },
  { to: "/admin/verifications", labelKey: "admin.nav.verifications", icon: <ShieldCheck className="h-4 w-4" />, permission: "verification:read" },
  { to: "/admin/users", labelKey: "admin.nav.users", icon: <Users className="h-4 w-4" />, permission: "users:read" },
  { to: "/admin/support", labelKey: "admin.nav.support", icon: <HelpCircle className="h-4 w-4" />, permission: "support:read" },
  { to: "/admin/payouts", labelKey: "admin.nav.payouts", icon: <Banknote className="h-4 w-4" />, permission: "payouts:read" },
  { to: "/admin/transactions", labelKey: "admin.nav.transactions", icon: <Receipt className="h-4 w-4" />, permission: "payments:read" },
  { to: "/admin/analytics", labelKey: "admin.nav.analytics", icon: <LineChart className="h-4 w-4" />, adminOnly: true },
  { to: "/admin/announcements", labelKey: "admin.nav.announcements", icon: <Bell className="h-4 w-4" />, permission: "announcements:write" },
  { to: "/admin/audit-logs", labelKey: "admin.nav.auditTrail", icon: <FileClock className="h-4 w-4" />, permission: "audit:read" },
  { to: "/admin/security-events", labelKey: "admin.nav.securityEvents", icon: <ShieldAlert className="h-4 w-4" />, permission: "security:read" },
  { to: "/admin/recovery-appeals", labelKey: "admin.nav.recoveryAppeals", icon: <LifeBuoy className="h-4 w-4" />, permission: "security:read" },
  { to: "/admin/security", labelKey: "admin.nav.mySecurity", icon: <KeyRound className="h-4 w-4" /> },
  { to: "/admin/staff", labelKey: "admin.nav.staff", icon: <Briefcase className="h-4 w-4" />, permission: "staff:read" },
  { to: "/admin/agents", labelKey: "admin.nav.agents", icon: <Sprout className="h-4 w-4" />, permission: "agents:read" },
  { to: "/admin/exchange", labelKey: "admin.nav.exchange", icon: <Recycle className="h-4 w-4" />, permission: "exchange:read" },
  { to: "/admin/roles", labelKey: "admin.nav.roles", icon: <Shield className="h-4 w-4" />, permission: "roles:read" },
  { to: "/admin/fees", labelKey: "admin.nav.fees", icon: <Receipt className="h-4 w-4" />, permission: "fees:read" },
  { to: "/admin/terms", labelKey: "admin.nav.terms", icon: <ScrollText className="h-4 w-4" />, permission: "terms:read" },
  { to: "/admin/team", labelKey: "admin.nav.team", icon: <UserCog className="h-4 w-4" />, superAdminOnly: true },
  { to: "/admin/config", labelKey: "admin.nav.config", icon: <Settings className="h-4 w-4" />, superAdminOnly: true },
];

/** Isolated admin portal shell — no marketplace or affiliate navigation. */
export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return null;

  const roleLabel =
    (user.role in (t("admin.roleLabels", { returnObjects: true }) as Record<string, string>)
      ? t(`admin.roleLabels.${user.role}`)
      : null) ?? t("admin.staffRole");

  const items = NAV.filter(
    (i) =>
      (!i.superAdminOnly || isSuperAdmin(user)) &&
      (!i.adminOnly || isAdmin(user)) &&
      (!i.permission || hasPermission(user, i.permission)),
  );

  const list = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
            )
          }
        >
          {item.icon}
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );

  const sidebarHeader = (
    <div className="px-6 py-6">
      <p className="font-display text-lg font-extrabold tracking-tight text-white">PhyhanAgro</p>
      <p className="text-xs uppercase tracking-widest text-sidebar-foreground/60">
        {t("admin.console")}
      </p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        {sidebarHeader}
        {list()}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("nav.openMenu")}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col bg-sidebar p-0 text-sidebar-foreground">
                <SheetHeader className="px-6 py-5 text-left">
                  <SheetTitle className="text-sidebar-foreground">
                    {t("admin.console")}
                  </SheetTitle>
                </SheetHeader>
                {list(() => setMobileOpen(false))}
              </SheetContent>
            </Sheet>
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-extrabold tracking-tight md:text-lg">
              {t("admin.administration")}
            </h1>
          </div>
          <Badge variant="outline" className="hidden border-primary/30 bg-primary/5 text-primary sm:inline-flex">
            {roleLabel}
          </Badge>
          {!mfaSatisfied(user) && (
            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
              {t("admin.mfaRequired")}
            </Badge>
          )}

          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher className="hidden md:block" />
            <ThemeToggle className="hidden md:inline-flex" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-secondary">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline">{user.name.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/security")}>
                  <KeyRound className="mr-2 h-4 w-4" /> {t("admin.securityMfa")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("nav.signOut")}
              onClick={() => {
                logout();
                navigate("/admin/login", { replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-10 pt-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
