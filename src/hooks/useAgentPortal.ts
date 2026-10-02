// Farm Agent PORTAL hooks (server: /api/agent). For the signed-in farm_agent's
// own portal — profile/onboarding, assignment handshake, activity, earnings, and
// on-behalf product/order management for ASSIGNED farmers only.
//
// UX only: the backend re-checks the capability token, the active-profile gate,
// and the per-request BOLA assignment on EVERY call. These hooks never confer
// authority; they just shape the requests and cache the responses.
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order, Product } from "@/types";
import type {
  AgentActivityItem,
  AgentAssignment,
  AgentEarnings,
  AgentProfile,
} from "@/types/agents";

const AGENT_BASE = "/agent";
const agentKey = ["agent"] as const;

/** Minimal on-behalf product write payload (server requires name/category/price/quantity/unit). */
export interface AgentProductInput {
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  description?: string;
  harvestDate?: string;
  status?: Product["status"];
}

// --- Profile / onboarding ---------------------------------------------------

/** The agent's own profile (null while unonboarded). Reachable while pending. */
export const useAgentMe = () =>
  useQuery({
    queryKey: [...agentKey, "me"],
    queryFn: async (): Promise<AgentProfile | null> => {
      const { data } = await api.get<{ data: { profile: AgentProfile | null } }>(
        `${AGENT_BASE}/me`,
      );
      return data.data.profile;
    },
  });

/** Submit / update the agent's own application note (creates a pending profile). */
export const useApplyAsAgent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (applicationNote?: string): Promise<AgentProfile> => {
      const { data } = await api.post<{ data: { profile: AgentProfile } }>(
        `${AGENT_BASE}/apply`,
        { applicationNote },
      );
      return data.data.profile;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKey }),
  });
};

// --- Assignments (roster + handshake) ---------------------------------------

/** Farmers this agent actively serves. Active-profile gated — enable only when active. */
export const useAgentFarmers = (enabled = true) =>
  useQuery({
    queryKey: [...agentKey, "farmers"],
    enabled,
    queryFn: async (): Promise<AgentAssignment[]> => {
      const { data } = await api.get<{ data: { items: AgentAssignment[] } }>(
        `${AGENT_BASE}/farmers`,
      );
      return data.data.items ?? [];
    },
  });

/** All of this agent's assignments (any status) — requests / history view. */
export const useAgentAssignments = (status?: string) =>
  useQuery({
    queryKey: [...agentKey, "assignments", status ?? "all"],
    queryFn: async (): Promise<AgentAssignment[]> => {
      const { data } = await api.get<{ data: { items: AgentAssignment[] } }>(
        `${AGENT_BASE}/assignments`,
        { params: status ? { status } : {} },
      );
      return data.data.items ?? [];
    },
  });

/** Agent requests to serve a farmer, by email. */
export const useRequestFarmer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (farmerEmail: string): Promise<AgentAssignment> => {
      const { data } = await api.post<{ data: { assignment: AgentAssignment } }>(
        `${AGENT_BASE}/assignments/request`,
        { farmerEmail },
      );
      return data.data.assignment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKey }),
  });
};

/** Agent accepts / declines a farmer's invitation. */
export const useRespondToAssignment = () => {
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
        `${AGENT_BASE}/assignments/${id}/${accept ? "accept" : "decline"}`,
      );
      return data.data.assignment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKey }),
  });
};

/** Agent ends their own assignment to a farmer. */
export const useEndAssignment = () => {
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
        `${AGENT_BASE}/assignments/${id}`,
        { data: reason ? { reason } : {} },
      );
      return data.data.assignment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKey }),
  });
};

// --- Activity + earnings ----------------------------------------------------

export const useAgentActivity = (limit = 50) =>
  useQuery({
    queryKey: [...agentKey, "activity", limit],
    queryFn: async (): Promise<AgentActivityItem[]> => {
      const { data } = await api.get<{ data: { items: AgentActivityItem[] } }>(
        `${AGENT_BASE}/activity`,
        { params: { limit } },
      );
      return data.data.items ?? [];
    },
  });

/** Earnings summary. Active-profile gated — enable only when active. */
export const useAgentEarnings = (enabled = true) =>
  useQuery({
    queryKey: [...agentKey, "earnings"],
    enabled,
    queryFn: async (): Promise<AgentEarnings> => {
      const { data } = await api.get<{ data: AgentEarnings }>(`${AGENT_BASE}/earnings`);
      return data.data;
    },
  });

// --- On-behalf farmer-scoped operations -------------------------------------

export const useAgentFarmerProducts = (farmerId?: string, enabled = true) =>
  useQuery({
    queryKey: [...agentKey, "farmer-products", farmerId],
    enabled: !!farmerId && enabled,
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<{ data: { items: Product[] } }>(
        `${AGENT_BASE}/farmers/${farmerId}/products`,
      );
      return data.data.items ?? [];
    },
  });

export const useAgentFarmerOrders = (farmerId?: string, enabled = true) =>
  useQuery({
    queryKey: [...agentKey, "farmer-orders", farmerId],
    enabled: !!farmerId && enabled,
    queryFn: async (): Promise<Order[]> => {
      const { data } = await api.get<{ data: { items: Order[] } }>(
        `${AGENT_BASE}/farmers/${farmerId}/orders`,
      );
      return data.data.items ?? [];
    },
  });

export const useCreateFarmerProduct = (farmerId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AgentProductInput): Promise<Product> => {
      const { data } = await api.post<{ data: Product }>(
        `${AGENT_BASE}/farmers/${farmerId}/products`,
        input,
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...agentKey, "farmer-products", farmerId] }),
  });
};

export const useUpdateFarmerProduct = (farmerId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: AgentProductInput & { id: string }): Promise<Product> => {
      const { data } = await api.patch<{ data: Product }>(
        `${AGENT_BASE}/farmers/${farmerId}/products/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...agentKey, "farmer-products", farmerId] }),
  });
};

export const useSetFarmerProductStatus = (farmerId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: NonNullable<Product["status"]>;
    }): Promise<Product> => {
      const { data } = await api.patch<{ data: Product }>(
        `${AGENT_BASE}/farmers/${farmerId}/products/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...agentKey, "farmer-products", farmerId] }),
  });
};
