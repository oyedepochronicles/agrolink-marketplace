// Admin-side hooks for the staff-management surface (server: /api/admin/staff).
//
// Distinct from useSecurity.ts's admin-team hooks (which manage only
// admin/super_admin via /admin/admin-users): this surface manages the FULL staff
// roster — built-in operational + custom operational roles — with StaffProfile
// identity data and the server-enforced privilege-escalation floor. Reads need
// `staff:read`, writes `staff:write`; the backend re-checks every request and
// owns the escalation guards, so these hooks are UX only.
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type StaffAccountState = "active" | "suspended" | "deactivated" | "deleted";
export type StaffStatus = "active" | "suspended" | "deactivated";

export interface StaffProfileData {
  _id?: string;
  userId?: string;
  employeeId?: string;
  department?: string;
  jobTitle?: string;
  status?: StaffStatus;
  notes?: string;
  dateJoined?: string;
  createdAt?: string;
  updatedAt?: string;
}

// role is a free string (may be a custom operational role), deliberately NOT the
// narrow client Role union.
export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  accountState: StaffAccountState;
  mfaEnabled?: boolean;
  inviteStatus?: string;
  isSuspended?: boolean;
  isDeactivated?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  staffProfile?: StaffProfileData | null;
  effectivePermissions?: string[];
}

export interface StaffListMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface StaffListResult {
  items: StaffMember[];
  meta?: StaffListMeta;
}

export interface StaffFilters {
  role?: string;
  accountState?: string;
  department?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface StaffActivity {
  actions: Array<Record<string, unknown>>;
  logins: Array<Record<string, unknown>>;
}

const STAFF_BASE = "/admin/staff";
const staffKey = ["admin", "staff"] as const;

export const useStaffList = (filters: StaffFilters = {}) =>
  useQuery({
    queryKey: [...staffKey, "list", filters],
    queryFn: async (): Promise<StaffListResult> => {
      const params: Record<string, string | number> = {};
      if (filters.role) params.role = filters.role;
      if (filters.accountState) params.accountState = filters.accountState;
      if (filters.department) params.department = filters.department;
      if (filters.q) params.q = filters.q;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      const { data } = await api.get<{ data: StaffMember[]; meta?: StaffListMeta }>(
        STAFF_BASE,
        { params },
      );
      return { items: data.data ?? [], meta: data.meta };
    },
  });

export const useStaffMember = (id?: string, enabled = true) =>
  useQuery({
    queryKey: [...staffKey, "detail", id],
    enabled: !!id && enabled,
    queryFn: async (): Promise<StaffMember> => {
      const { data } = await api.get<{ data: StaffMember }>(`${STAFF_BASE}/${id}`);
      return data.data;
    },
  });

export const useStaffActivity = (id?: string, enabled = true) =>
  useQuery({
    queryKey: [...staffKey, "activity", id],
    enabled: !!id && enabled,
    queryFn: async (): Promise<StaffActivity> => {
      const { data } = await api.get<{ data: StaffActivity }>(
        `${STAFF_BASE}/${id}/activity`,
      );
      return data.data;
    },
  });

export interface CreateStaffInput {
  name: string;
  email: string;
  role: string;
  department?: string;
  jobTitle?: string;
  employeeId?: string;
}

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStaffInput) => {
      const { data } = await api.post<{ data: StaffMember; inviteUrl?: string }>(
        STAFF_BASE,
        input,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKey }),
  });
};

export interface UpdateStaffInput {
  id: string;
  department?: string;
  jobTitle?: string;
  employeeId?: string;
  notes?: string;
  status?: StaffStatus;
}

export const useUpdateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateStaffInput) => {
      const { data } = await api.patch<{ data: StaffMember }>(
        `${STAFF_BASE}/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKey }),
  });
};

export const useChangeStaffRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data } = await api.patch<{ data: StaffMember }>(
        `${STAFF_BASE}/${id}/role`,
        { role },
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKey }),
  });
};
