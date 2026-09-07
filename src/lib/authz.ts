/**
 * Centralized authorization utilities.
 *
 * IMPORTANT: these helpers are UX / defense-in-depth only. The backend remains
 * the sole authority for authentication, roles, verification and ownership.
 * Never treat any value derived here as proof of permission.
 */
import type { Role, User } from "@/types";

export type AnyRole = Role;

export const ADMIN_ROLES: Role[] = ["admin", "super_admin"];
export const AFFILIATE_ROLES: Role[] = ["export_partner" as Role, "affiliate" as Role];

export const isAuthenticated = (user: User | null | undefined): user is User => !!user;

export const hasRole = (user: User | null | undefined, role: Role) => user?.role === role;

export const hasAnyRole = (user: User | null | undefined, roles: Role[]) =>
  !!user && roles.includes(user.role);

export const isSuperAdmin = (user: User | null | undefined) => hasRole(user, "super_admin");
export const isAdmin = (user: User | null | undefined) => hasAnyRole(user, ADMIN_ROLES);
export const isFarmer = (user: User | null | undefined) => hasRole(user, "farmer");
export const isRider = (user: User | null | undefined) => hasRole(user, "rider");
export const isBuyer = (user: User | null | undefined) => hasRole(user, "buyer");
export const isAffiliate = (user: User | null | undefined) => hasAnyRole(user, AFFILIATE_ROLES);

/** Backend-reported account state gates. */
export const isSuspended = (user: User | null | undefined) =>
  user?.isSuspended === true || user?.accountState === "suspended";
export const isDeactivated = (user: User | null | undefined) =>
  user?.isDeactivated === true || user?.accountState === "deactivated";

/** KYC verification, as reported by the backend only. */
export const isVerified = (user: User | null | undefined) =>
  user?.isVerified === true || user?.verificationStatus === "approved";

/** Operational roles that must complete APPLICATION -> VERIFICATION -> APPROVAL. */
export const requiresVerification = (user: User | null | undefined) =>
  isFarmer(user) || isRider(user) || isAffiliate(user);

/** Can this user perform privileged operational actions right now? */
export const canOperate = (user: User | null | undefined) =>
  isAuthenticated(user) &&
  !isSuspended(user) &&
  !isDeactivated(user) &&
  (!requiresVerification(user) || isVerified(user));

/** MFA is mandatory for admin + super_admin. */
export const mfaRequiredForUser = (user: User | null | undefined) => isAdmin(user);
export const mfaSatisfied = (user: User | null | undefined) =>
  !mfaRequiredForUser(user) || user?.mfaEnabled === true;

/** The single portal a user belongs to, derived from the backend role. */
export const portalPathFor = (user: User | null | undefined): string => {
  if (!user) return "/login";
  if (isAdmin(user)) return "/admin";
  if (isFarmer(user)) return "/dashboard/farmer";
  if (isRider(user)) return "/dashboard/rider";
  if (isAffiliate(user)) return "/dashboard/affiliate";
  return "/marketplace";
};
