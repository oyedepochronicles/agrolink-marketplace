// Admin-side hooks for managing system configuration items.
import { api } from "@/lib/api";
import type { ConfigItem, ConfigType } from "@/types/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const invalidateConfig = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["admin", "system-config"] });
  qc.invalidateQueries({ queryKey: ["system-config"] });
};

export const useAdminConfigItems = () =>
  useQuery({
    queryKey: ["admin", "system-config"],
    queryFn: async (): Promise<ConfigItem[]> => {
      try {
        const { data } = await api.get<{ data?: ConfigItem[] } | ConfigItem[]>(
          "/admin/config",
        );
        return Array.isArray(data) ? data : data.data ?? [];
      } catch {
        return [];
      }
    },
  });

export const useBulkUpdateConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      configs: Array<{
        key: string;
        value: unknown;
        category: string;
        description?: string;
        valueType?: ConfigType;
        public?: boolean;
      }>,
    ) => {
      const { data } = await api.post("/admin/config/bulk/update", {
        configs,
      });
      return data;
    },
    onSuccess: () => invalidateConfig(qc),
  });
};

export interface CreateConfigInput {
  key: string;
  value: unknown;
  category: string;
  description?: string;
  valueType?: ConfigType;
  public?: boolean;
}

export const useCreateConfigKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateConfigInput) => {
      const { data } = await api.post("/admin/config", input);
      return data;
    },
    onSuccess: () => invalidateConfig(qc),
  });
};

export const useUpdateConfigKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      key: string;
      value: unknown;
      description?: string;
      valueType?: ConfigType;
      public?: boolean;
    }) => {
      const { key, ...body } = input;
      const { data } = await api.put(`/admin/config/${key}`, body);
      return data;
    },
    onSuccess: () => invalidateConfig(qc),
  });
};

export const useDeleteConfigKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { data } = await api.delete(`/admin/config/${key}`);
      return data;
    },
    onSuccess: () => invalidateConfig(qc),
  });
};

export const useResetConfigKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { data } = await api.post(`/admin/config/${key}/reset`);
      return data;
    },
    onSuccess: () => invalidateConfig(qc),
  });
};

// ---- RBAC permission matrix (super_admin-only) --------------------------------

export type PermissionMatrix = Record<string, string[]>;

export interface PermissionCatalog {
  /** token -> human label */
  permissions: Record<string, string>;
  tokens: string[];
  roles: string[];
  wildcard: string;
  defaults: PermissionMatrix;
}

const RBAC_BASE = "/admin/config/permissions";

export const usePermissionCatalog = (enabled = true) =>
  useQuery({
    queryKey: ["admin", "rbac", "catalog"],
    enabled,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<PermissionCatalog> => {
      const { data } = await api.get<{ data: PermissionCatalog }>(
        `${RBAC_BASE}/catalog`,
      );
      return data.data;
    },
  });

export const usePermissionMatrix = (enabled = true) =>
  useQuery({
    queryKey: ["admin", "rbac", "matrix"],
    enabled,
    queryFn: async (): Promise<PermissionMatrix> => {
      const { data } = await api.get<{ data: PermissionMatrix }>(RBAC_BASE);
      return data.data;
    },
  });

export const useUpdatePermissionMatrix = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matrix: PermissionMatrix): Promise<PermissionMatrix> => {
      const { data } = await api.put<{ data: PermissionMatrix }>(RBAC_BASE, {
        matrix,
      });
      return data.data;
    },
    onSuccess: (matrix) => {
      qc.setQueryData(["admin", "rbac", "matrix"], matrix);
      qc.invalidateQueries({ queryKey: ["admin", "rbac", "matrix"] });
    },
  });
};

export const useResetPermissionMatrix = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<PermissionMatrix> => {
      const { data } = await api.post<{ data: PermissionMatrix }>(
        `${RBAC_BASE}/reset`,
      );
      return data.data;
    },
    onSuccess: (matrix) => {
      qc.setQueryData(["admin", "rbac", "matrix"], matrix);
      qc.invalidateQueries({ queryKey: ["admin", "rbac", "matrix"] });
    },
  });
};
