import { api } from "@/lib/api";
import type { Announcement } from "@/types/announcement";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const KEY = [
  "announcements",
  "mine",
  "info",
  "updates",
  "warnings",
  "promotions",
];

export const useAnnouncements = () =>
  useQuery({
    queryKey: KEY,
    staleTime: 60_000,
    queryFn: async (): Promise<Announcement[]> => {
      try {
        const { data } = await api.get<
          { data?: Announcement[] } | Announcement[]
        >("/announcements/");
        return Array.isArray(data) ? data : (data.data ?? []);
      } catch {
        return [];
      }
    },
  });

export const useDismissAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/announcements/${id}/dismiss`, { dismissed: true });
    },
    onSuccess: (_d, id) => {
      qc.setQueryData<Announcement[]>(KEY, (prev) =>
        (prev ?? []).map((a) =>
          a._id === id ? { ...a, isDismissed: true } : a,
        ),
      );
    },
  });
};
