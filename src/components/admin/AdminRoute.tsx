import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasPermission,
  isAdmin,
  isDeactivated,
  isStaff,
  isSuperAdmin,
  isSuspended,
  mfaSatisfied,
} from "@/lib/authz";

interface Props {
  children: JSX.Element;
  /** Restrict further, e.g. super-admin-only settings. */
  superAdminOnly?: boolean;
  /** Restrict to admin-tier staff (admin + super_admin) — for pages with no capability token. */
  adminOnly?: boolean;
  /** Require a specific capability token (wildcard-aware); admits any staff role that holds it. */
  permission?: string;
}

/**
 * Guard for the isolated /admin portal.
 * Layered checks: authenticated -> staff role -> account healthy -> MFA enrolled
 * -> optional super-admin / admin / permission refinement.
 * The backend enforces all of this again on every request.
 */
export const AdminRoute = ({ children, superAdminOnly, adminOnly, permission }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Never reveal that /admin exists to non-staff: send them to a neutral 404.
  if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (!isStaff(user)) return <Navigate to="/404" replace />;
  if (isSuspended(user) || isDeactivated(user)) {
    return <Navigate to="/unauthorized" state={{ reason: "suspended" }} replace />;
  }
  // MFA is mandatory for admins only (mfaSatisfied is a no-op for ops roles).
  if (!mfaSatisfied(user) && location.pathname !== "/admin/security") {
    return <Navigate to="/admin/security" state={{ enroll: true }} replace />;
  }
  if (superAdminOnly && !isSuperAdmin(user)) {
    return <Navigate to="/unauthorized" state={{ reason: "forbidden" }} replace />;
  }
  if (adminOnly && !isAdmin(user)) {
    return <Navigate to="/unauthorized" state={{ reason: "forbidden" }} replace />;
  }
  if (permission && !hasPermission(user, permission)) {
    return <Navigate to="/unauthorized" state={{ reason: "forbidden" }} replace />;
  }

  return children;
};
