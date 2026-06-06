// Admin-side hooks for managing system configuration items.
import { api } from "@/lib/api";
import type { ConfigItem } from "@/types/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdminConfigItems = () =>
  useQuery({
    queryKey: ["admin", "system-config"],
    queryFn: async (): Promise<ConfigItem[]> => {
      try {
        const { data } = await api.get<{ items?: ConfigItem[] } | ConfigItem[]>(
          "/admin/configuration",
        );
        return Array.isArray(data) ? data : (data.items ?? []);
      } catch {
        return [];
      }
    },
  });

export const useBulkUpdateConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Array<{ key: string; value: unknown }>) => {
      const { data } = await api.post("/admin/configuration/bulk-update", {
        updates,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "system-config"] });
      qc.invalidateQueries({ queryKey: ["system-config"] });
    },
  });
};

export const useResetConfigKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { data } = await api.post(`/admin/configuration/${key}/reset`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "system-config"] });
      qc.invalidateQueries({ queryKey: ["system-config"] });
    },
  });
};
