// Admin agent-management hooks (server: /api/admin/agents). Reads need
// `agents:read`; the approval lifecycle needs `agents:approve`; direct farmer
// assignment needs `agents:assign`. These are ADMIN-default tokens — distinct from
// `agents:act`, which is reserved to farm_agent — so an admin manages agents but
// can never itself act on behalf of a farmer. The backend audits every mutation.
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentActivityItem, AgentAssignment, AgentProfile } from "@/types/agents";

const ADMIN_AGENTS_BASE = "/admin/agents";
const adminAgentsKey = ["admin", "agents"] as const;

export interface AdminAgentDetail {
  profile: AgentProfile;
  farmers: AgentAssignment[];
}

export type AgentDecision = "approve" | "suspend" | "reject";

/** Agent roster (optionally filtered by status). NOTE: the server returns the
 *  array directly on `data` (not wrapped in `{ items }`). */
export const useAdminAgents = (status?: string) =>
  useQuery({
    queryKey: [...adminAgentsKey, "list", status ?? "all"],
    queryFn: async (): Promise<AgentProfile[]> => {
      const { data } = await api.get<{ data: AgentProfile[] }>(ADMIN_AGENTS_BASE, {
        params: status ? { status } : {},
      });
      return data.data ?? [];
    },
  });

export const useAdminAgentDetail = (id?: string, enabled = true) =>
  useQuery({
    queryKey: [...adminAgentsKey, "detail", id],
    enabled: !!id && enabled,
    queryFn: async (): Promise<AdminAgentDetail> => {
      const { data } = await api.get<{ data: AdminAgentDetail }>(
        `${ADMIN_AGENTS_BASE}/${id}`,
      );
      return data.data;
    },
  });

export const useAdminAgentActivity = (id?: string, enabled = true) =>
  useQuery({
    queryKey: [...adminAgentsKey, "activity", id],
    enabled: !!id && enabled,
    queryFn: async (): Promise<AgentActivityItem[]> => {
      const { data } = await api.get<{ data: { items: AgentActivityItem[] } }>(
        `${ADMIN_AGENTS_BASE}/${id}/activity`,
      );
      return data.data.items ?? [];
    },
  });

/** Approve / suspend / reject an agent. suspend + reject require a reason. */
export const useAgentDecision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: AgentDecision;
      reason?: string;
    }): Promise<AgentProfile> => {
      const { data } = await api.post<{ data: { profile: AgentProfile } }>(
        `${ADMIN_AGENTS_BASE}/${id}/${decision}`,
        reason ? { reason } : {},
      );
      return data.data.profile;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminAgentsKey }),
  });
};

/** Direct admin assignment of an agent to a farmer (creates an ACTIVE link). */
export const useAssignAgentToFarmer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      farmerId,
      agentId,
    }: {
      farmerId: string;
      agentId: string;
    }): Promise<AgentAssignment> => {
      const { data } = await api.post<{ data: { assignment: AgentAssignment } }>(
        `${ADMIN_AGENTS_BASE}/assign`,
        { farmerId, agentId },
      );
      return data.data.assignment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminAgentsKey }),
  });
};

/** Admin revokes any assignment. */
export const useRevokeAgentAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason?: string;
    }): Promise<AgentAssignment> => {
      const { data } = await api.delete<{ data: { assignment: AgentAssignment } }>(
        `${ADMIN_AGENTS_BASE}/assignments/${id}`,
        { data: reason ? { reason } : {} },
      );
      return data.data.assignment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminAgentsKey }),
  });
};
