import { api } from "@/lib/api";
import type { Announcement, AnnouncementStatus } from "@/types/announcement";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const KEY = ["admin", "announcements"];

export const useAdminAnnouncements = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Announcement[]> => {
      try {
        const { data } = await api.get<
          { items?: Announcement[] } | Announcement[]
        >("/admin/announcements");
        return Array.isArray(data) ? data : (data.items ?? []);
      } catch {
        return [];
      }
    },
  });

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Announcement>) => {
      const { data } = await api.post<Announcement>(
        "/admin/announcements",
        input,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useUpdateAnnouncementStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AnnouncementStatus;
    }) => {
      const { data } = await api.patch<Announcement>(
        `/admin/announcements/${id}`,
        { status },
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeleteAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/announcements/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
