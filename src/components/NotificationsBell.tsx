import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useNotificationSocket,
} from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification } from "@/types";

interface Props {
  variant?: "default" | "light";
}

export const NotificationsBell = ({ variant = "default" }: Props) => {
  useNotificationSocket();
  const { user } = useAuth();
  const { data: items = [] } = useNotifications();
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = items.filter((n) => !n.read).length;

  const resolveUrl = (n: Notification) => {
    const raw = n.url || n.link;
    const conversationId =
      typeof n.meta?.conversationId === "string" ? n.meta.conversationId : undefined;

    if (n.type === "chat" || raw?.startsWith("/messages")) {
      const query = conversationId ? `?conversation=${encodeURIComponent(conversationId)}` : "";
      if (user?.role === "farmer") return `/dashboard/farmer/messages${query}`;
      if (user?.role === "rider") return `/dashboard/rider/messages${query}`;
      if (user?.role === "admin" || user?.role === "super_admin") return `/dashboard/admin/messages${query}`;
      return `/marketplace/messages${query}`;
    }

    if (n.type === "order") {
      if (user?.role === "farmer") return "/dashboard/farmer/orders";
      if (user?.role === "rider") return "/dashboard/rider";
      return "/marketplace/orders";
    }

    if (!raw) return undefined;
    if (raw === "/farmer" || raw.startsWith("/farmer/")) return "/dashboard/farmer/orders";
    if (raw === "/rider" || raw.startsWith("/rider/")) return "/dashboard/rider";
    if (raw === "/orders" || raw.startsWith("/orders")) return "/marketplace/orders";
    if (raw.startsWith("/products/")) return raw.replace("/products/", "/marketplace/product/");
    if (raw === "/account") return user?.role === "buyer" ? "/marketplace/profile" : `/dashboard/${user?.role}`;
    return raw;
  };

  const handleClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n._id);
    const url = resolveUrl(n);
    if (url) navigate(url);
  };

  const safeTime = (s?: string) => {
    if (!s) return "";
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? "" : formatDistanceToNow(d, { addSuffix: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className={cn(
            "relative rounded-full",
            variant === "light" && "text-foreground hover:bg-secondary",
          )}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs"
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-base hover:bg-secondary/60",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                      {n.body && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      )}
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                        {safeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
