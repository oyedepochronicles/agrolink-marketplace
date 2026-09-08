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
import { isSuperAdmin, mfaSatisfied } from "@/lib/authz";
import { cn } from "@/lib/utils";
import {
  Banknote,
  BarChart3,
  Bell,
  FileClock,
  HelpCircle,
  KeyRound,
  LineChart,
  LogOut,
  Menu,
  PackageCheck,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  UserCog,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

interface Entry {
  to: string;
  label: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
}

const NAV: Entry[] = [
  { to: "/admin", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/admin/orders", label: "Orders", icon: <ShoppingCart className="h-4 w-4" /> },
  { to: "/admin/products", label: "Product review", icon: <PackageCheck className="h-4 w-4" /> },
  { to: "/admin/verifications", label: "Verifications", icon: <ShieldCheck className="h-4 w-4" /> },
  { to: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/support", label: "Support inbox", icon: <HelpCircle className="h-4 w-4" /> },
  { to: "/admin/payouts", label: "Payouts", icon: <Banknote className="h-4 w-4" /> },
  { to: "/admin/analytics", label: "Analytics", icon: <LineChart className="h-4 w-4" /> },
  { to: "/admin/announcements", label: "Announcements", icon: <Bell className="h-4 w-4" /> },
  { to: "/admin/audit-logs", label: "Audit trail", icon: <FileClock className="h-4 w-4" /> },
  { to: "/admin/security-events", label: "Security events", icon: <ShieldAlert className="h-4 w-4" /> },
  { to: "/admin/security", label: "My security", icon: <KeyRound className="h-4 w-4" /> },
  { to: "/admin/team", label: "Admin team", icon: <UserCog className="h-4 w-4" />, superAdminOnly: true },
  { to: "/admin/config", label: "Platform config", icon: <Settings className="h-4 w-4" />, superAdminOnly: true },
];

/** Isolated admin portal shell — no marketplace or affiliate navigation. */
export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return null;

  const items = NAV.filter((i) => !i.superAdminOnly || isSuperAdmin(user));

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
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const header = (
    <div className="px-6 py-6">
      <p className="font-display text-lg font-extrabold tracking-tight text-white">PhyhanAgro</p>
      <p className="text-xs uppercase tracking-widest text-sidebar-foreground/60">Admin console</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        {header}
        {list()}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col bg-sidebar p-0 text-sidebar-foreground">
                <SheetHeader className="px-6 py-5 text-left">
                  <SheetTitle className="text-sidebar-foreground">Admin console</SheetTitle>
                </SheetHeader>
                {list(() => setMobileOpen(false))}
              </SheetContent>
            </Sheet>
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-extrabold tracking-tight md:text-lg">
              Administration
            </h1>
          </div>
          <Badge variant="outline" className="hidden border-primary/30 bg-primary/5 text-primary sm:inline-flex">
            {isSuperAdmin(user) ? "Super admin" : "Admin"}
          </Badge>
          {!mfaSatisfied(user) && (
            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
              MFA required
            </Badge>
          )}

          <div className="ml-auto flex items-center gap-2">
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
                  <KeyRound className="mr-2 h-4 w-4" /> Security & MFA
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
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
