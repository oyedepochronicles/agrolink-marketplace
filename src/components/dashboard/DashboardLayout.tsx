import { Brand } from "@/components/Brand";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import {
  BarChart3,
  Box,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

interface NavEntry {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_BY_ROLE: Record<
  Exclude<Role, "buyer" | "super_admin">,
  NavEntry[]
> = {
  farmer: [
    {
      to: "/dashboard/farmer",
      label: "Overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      to: "/dashboard/farmer/products",
      label: "Products",
      icon: <Box className="h-4 w-4" />,
    },
    {
      to: "/dashboard/farmer/orders",
      label: "Orders",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      to: "/dashboard/farmer/messages",
      label: "Messages",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      to: "/dashboard/farmer/wallet",
      label: "Wallet",
      icon: <Wallet className="h-4 w-4" />,
    },
  ],
  rider: [
    {
      to: "/dashboard/rider",
      label: "Deliveries",
      icon: <Truck className="h-4 w-4" />,
    },
    {
      to: "/dashboard/rider/messages",
      label: "Messages",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      to: "/dashboard/rider/earnings",
      label: "Earnings",
      icon: <Wallet className="h-4 w-4" />,
    },
  ],
  admin: [
    {
      to: "/dashboard/admin",
      label: "Overview",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      to: "/dashboard/admin/verifications",
      label: "Verifications",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      to: "/dashboard/admin/users",
      label: "Users",
      icon: <Users className="h-4 w-4" />,
    },
    {
      to: "/dashboard/admin/products",
      label: "Products",
      icon: <PackageCheck className="h-4 w-4" />,
    },
    {
      to: "/dashboard/admin/messages",
      label: "Messages",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ],
};

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user || user.role === "buyer") return null;
  const items = NAV_BY_ROLE[user.role];

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 py-6">
          <Brand
            variant="light"
            to={`/dashboard/${user.role === "super_admin" ? "admin" : user.role}`}
          />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-base",
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
        <div className="space-y-2 p-3">
          <Button
            variant="outline"
            className="w-full justify-start rounded-xl border-white/15 bg-white/5 text-sidebar-foreground hover:bg-white/10 hover:text-white"
            onClick={() => navigate("/marketplace")}
          >
            <ClipboardList className="mr-2 h-4 w-4" /> Go to marketplace
          </Button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <Brand to={`/dashboard/${user.role}`} />
          </div>
          <div className="hidden md:block">
            <h1 className="font-display text-lg font-extrabold capitalize tracking-tight">
              {user.role} dashboard
            </h1>
            {user.verificationStatus === "pending" && (
              <Badge
                variant="outline"
                className="mt-0.5 border-warning/40 bg-warning/10 text-warning-foreground"
              >
                Verification pending
              </Badge>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <NotificationsBell variant="light" />
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 pr-3">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">
                {user.name.split(" ")[0]}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background md:hidden">
          {items.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
