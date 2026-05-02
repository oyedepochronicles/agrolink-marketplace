import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification } from "@/types";

const unwrap = <T,>(data: unknown, fallback: T): T => {
  const d = data as { data?: T; items?: T; notifications?: T };
  return (d?.data ?? d?.items ?? d?.notifications ?? (Array.isArray(data) ? (data as T) : fallback)) as T;
};

export const NOTIFICATIONS_KEY = ["notifications"] as const;

export const useNotifications = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    enabled: !!user,
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return unwrap<Notification[]>(data, []);
    },
    refetchInterval: 60_000,
    staleTime: 15_000,
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const prev = qc.getQueryData<Notification[]>(NOTIFICATIONS_KEY);
      qc.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) =>
        (old ?? []).map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(NOTIFICATIONS_KEY, ctx.prev),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/notifications/read-all`);
      return data;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const prev = qc.getQueryData<Notification[]>(NOTIFICATIONS_KEY);
      qc.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) =>
        (old ?? []).map((n) => ({ ...n, read: true })),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(NOTIFICATIONS_KEY, ctx.prev),
  });
};

/** Subscribe to live notifications via socket. */
export const useNotificationSocket = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const onNew = (n: Notification) => {
      qc.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (prev) => {
        if (!prev) return [n];
        if (prev.some((x) => x._id === n._id)) return prev;
        return [n, ...prev];
      });
    };
    socket.on("notification:new", onNew);
    return () => { socket.off("notification:new", onNew); };
  }, [user, qc]);
};
