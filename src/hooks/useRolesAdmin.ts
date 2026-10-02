// Admin-side hooks for dynamic operational roles (server: /api/admin/roles).
//
// Distinct from the RBAC matrix hooks in useSystemConfigAdmin.ts (which edit the
// built-in role -> token override at /admin/config/permissions): this surface is
// the CUSTOM-role lifecycle (create / edit / duplicate / enable-disable / delete).
// Reads need `roles:read` (admins may view); writes are super_admin-only and
// enforced server-side. Every mutation refreshes the live permission matrix on
// the backend, so role changes take effect immediately.
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type RoleStatus = "active" | "disabled";

export interface RoleItem {
  _id?: string;
  roleKey: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isOperational: boolean;
  status: RoleStatus;
  permissions: string[];
  effectivePermissions: string[];
  userCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleCatalog {
  /** token -> human label */
  permissions: Record<string, string>;
  /** tokens a custom role MAY be granted (everything except the reserved set) */
  grantableTokens: string[];
  /** super_admin-only powers that can never be granted to a custom role */
  reservedTokens: string[];
  roleSpecificTokens: string[];
  wildcard: string;
}

const ROLES_BASE = "/admin/roles";
const rolesKey = ["admin", "roles"] as const;

export const useRolesList = (enabled = true) =>
  useQuery({
    queryKey: [...rolesKey, "list"],
    enabled,
    queryFn: async (): Promise<RoleItem[]> => {
      const { data } = await api.get<{ data: RoleItem[] }>(ROLES_BASE);
      return data.data ?? [];
    },
  });

export const useRoleCatalog = (enabled = true) =>
  useQuery({
    queryKey: [...rolesKey, "catalog"],
    enabled,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<RoleCatalog> => {
      const { data } = await api.get<{ data: RoleCatalog }>(`${ROLES_BASE}/catalog`);
      return data.data;
    },
  });

export interface CreateRoleInput {
  roleKey: string;
  name: string;
  description?: string;
  permissions?: string[];
  isOperational?: boolean;
}

export const useCreateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const { data } = await api.post<{ data: RoleItem }>(ROLES_BASE, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKey }),
  });
};

export interface UpdateRoleInput {
  roleKey: string;
  name?: string;
  description?: string;
  permissions?: string[];
  isOperational?: boolean;
}

export const useUpdateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleKey, ...body }: UpdateRoleInput) => {
      const { data } = await api.patch<{ data: RoleItem }>(
        `${ROLES_BASE}/${roleKey}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKey }),
  });
};

export interface DuplicateRoleInput {
  sourceKey: string;
  roleKey: string;
  name?: string;
  description?: string;
}

export const useDuplicateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceKey, ...body }: DuplicateRoleInput) => {
      const { data } = await api.post<{ data: RoleItem }>(
        `${ROLES_BASE}/${sourceKey}/duplicate`,
        body,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKey }),
  });
};

export const useSetRoleStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleKey,
      status,
    }: {
      roleKey: string;
      status: RoleStatus;
    }) => {
      const { data } = await api.patch<{ data: RoleItem }>(
        `${ROLES_BASE}/${roleKey}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKey }),
  });
};

export const useDeleteRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roleKey: string) => {
      const { data } = await api.delete<{
        data: { roleKey: string; deleted: boolean };
      }>(`${ROLES_BASE}/${roleKey}`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKey }),
  });
};
