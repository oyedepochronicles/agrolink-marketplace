// Farm Agent (Feature 4) shared client types.
//
// Mirrors the server contracts in routes/agent.routes.js, routes/myAgent.routes.js
// and routes/adminAgent.routes.js. A key shape detail: assignment/profile refs
// (farmerId / agentId / userId) come back POPULATED (an object) from the list
// endpoints but RAW (an id string) from the mutation endpoints
// (invite/request/accept/decline/remove). Every consumer must handle both — use
// the `refId` / `refUser` helpers below rather than reaching into the field.

import type { User } from "@/types";

export type AgentStatus = "pending" | "active" | "suspended" | "rejected";
export type AssignmentStatus = "pending" | "active" | "removed";
export type AssignmentInitiator = "farmer" | "agent" | "admin";

/** The subset of User fields the server populates onto agent/farmer refs. */
export type AgentUserRef = Pick<
  User,
  | "_id"
  | "name"
  | "email"
  | "phone"
  | "role"
  | "isSuspended"
  | "isDeactivated"
  | "isDeleted"
  | "farmerProfile"
  | "location"
>;

/**
 * A reference that may arrive populated (object) or raw (id string). Read it
 * with refId() / refUser() so both shapes are handled uniformly.
 */
export type MaybeRef = AgentUserRef | string | null | undefined;

/** AgentProfile — 1:1 with a farm_agent User (routes return `{ profile }`). */
export interface AgentProfile {
  _id: string;
  userId: MaybeRef;
  status: AgentStatus;
  applicationNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  suspensionReason?: string;
  suspendedBy?: string;
  suspendedAt?: string;
  activeFarmerCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** FarmerAgentAssignment — the source of truth for on-behalf authorization. */
export interface AgentAssignment {
  _id: string;
  farmerId: MaybeRef;
  agentId: MaybeRef;
  status: AssignmentStatus;
  initiatedBy: AssignmentInitiator;
  assignedBy?: string;
  assignedAt?: string;
  activatedAt?: string;
  removedBy?: string;
  removedAt?: string;
  removalReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** AgentActivity — append-only, immutable ledger row (farmerId populated to name). */
export interface AgentActivityItem {
  _id: string;
  agentId: string;
  farmerId?: MaybeRef;
  action: string;
  targetType?: "product" | "order" | "inventory" | "assignment" | "profile" | "system";
  targetId?: string;
  metadata?: Record<string, unknown>;
  outcome?: "success" | "failure";
  statusCode?: number;
  createdAt: string;
}

/**
 * Agent earnings summary. Commission is intentionally null until the Phase 5 fee
 * engine is wired — the UI must show "not yet configured", never a fabricated 0.
 */
export interface AgentEarnings {
  ordersFacilitated: number;
  paidOrdersFacilitated: number;
  grossFacilitated: number;
  activeFarmers: number;
  commission: number | null;
  pendingPayouts: unknown[];
}

/** True when a ref is a populated object rather than a bare id string. */
export const isPopulatedRef = (ref: MaybeRef): ref is AgentUserRef =>
  !!ref && typeof ref === "object";

/** The id of a ref, whether populated or raw. */
export const refId = (ref: MaybeRef): string =>
  isPopulatedRef(ref) ? ref._id : (ref ?? "");

/** The populated user of a ref, or null when only an id was returned. */
export const refUser = (ref: MaybeRef): AgentUserRef | null =>
  isPopulatedRef(ref) ? ref : null;

/** A human label for a farmer/agent ref — name, farm name, or a short id fallback. */
export const refLabel = (ref: MaybeRef): string => {
  const user = refUser(ref);
  if (!user) {
    const id = refId(ref);
    return id ? `#${id.slice(-6)}` : "Unknown";
  }
  return user.name || user.farmerProfile?.farmName || user.email || `#${user._id.slice(-6)}`;
};
