// Farmer-facing "My Agent" hooks (server: /api/my-agent). Lets a FARMER manage who
// represents them: see current/pending agents, invite an agent by email, accept or
// decline an agent's request, and remove their agent (which revokes on-behalf
// access immediately, server-side). Gated by requireRole('farmer') on the backend.
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentAssignment } from "@/types/agents";

const MY_AGENT_BASE = "/my-agent";
const myAgentKey = ["my-agent"] as const;

/** The farmer's agents across states (agentId populated). */
export const useMyAgents = (status?: string) =>
  useQuery({
    queryKey: [...myAgentKey, status ?? "all"],
    queryFn: async (): Promise<AgentAssignment[]> => {
      const { data } = await api.get<{ data: { items: AgentAssignment[] } }>(
        MY_AGENT_BASE,
        { params: status ? { status } : {} },
      );
      return data.data.items ?? [];
    },
  });

/** Farmer invites an agent to represent them (by email). */
export const useInviteAgent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agentEmail: string): Promise<AgentAssignment> => {
      const { data } = await api.post<{ data: { assignment: AgentAssignment } }>(
        `${MY_AGENT_BASE}/invite`,
        { agentEmail },
      );
      return data.data.assignment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: myAgentKey }),
  });
};

/** Farmer accepts / declines an agent's request to serve them. */
export const useRespondToAgentRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      accept,
    }: {
      id: string;
      accept: boolean;
    }): Promise<AgentAssignment> => {
      const { data } = await api.post<{ data: { assignment: AgentAssignment } }>(
        `${MY_AGENT_BASE}/assignments/${id}/${accept ? "accept" : "decline"}`,
      );
      return data.data.assignment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: myAgentKey }),
  });
};

/** Farmer removes/ends their assignment to an agent (active or pending). */
export const useRemoveMyAgent = () => {
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
        `${MY_AGENT_BASE}/assignments/${id}`,
        { data: reason ? { reason } : {} },
      );
      return data.data.assignment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: myAgentKey }),
  });
};
