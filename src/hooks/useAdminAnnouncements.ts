import { api } from "@/lib/api";
import type { Announcement } from "@/types/announcement";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const KEY = ["admin", "announcements"];

export const useAdminAnnouncements = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Announcement[]> => {
      try {
        const { data } = await api.get<
          { data: Announcement[] } | Announcement[]
        >("/announcements/admin/all");
        console.log("Fetched admin announcements: ", data);
        return Array.isArray(data) ? data : (data.data ?? []);
      } catch (e) {
        console.log("Failed to fetch admin announcements: ", e);
        return [];
      }
    },
  });

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Announcement>) => {
      const { data } = await api.post<Announcement>(
        "/announcements/admin/create",
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
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await api.patch<Announcement>(
        `/announcements/admin/toggle/${id}`,
        { isActive },
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
export const useUpdateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Announcement>;
    }) => {
      const { data } = await api.put<Announcement>(
        `/announcements/admin/update/${id}`,
        input,
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
      await api.delete(`/announcements/admin/delete/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
