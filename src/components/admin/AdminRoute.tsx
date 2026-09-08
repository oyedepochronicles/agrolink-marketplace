import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isDeactivated, isSuperAdmin, isSuspended, mfaSatisfied } from "@/lib/authz";

interface Props {
  children: JSX.Element;
  /** Restrict further, e.g. super-admin-only settings. */
  superAdminOnly?: boolean;
}

/**
 * Guard for the isolated /admin portal.
 * Layered checks: authenticated -> admin role -> account healthy -> MFA enrolled.
 * The backend enforces all of this again on every request.
 */
export const AdminRoute = ({ children, superAdminOnly }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Never reveal that /admin exists to non-admins: send them to a neutral 404.
  if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (!isAdmin(user)) return <Navigate to="/404" replace />;
  if (isSuspended(user) || isDeactivated(user)) {
    return <Navigate to="/unauthorized" state={{ reason: "suspended" }} replace />;
  }
  if (!mfaSatisfied(user) && location.pathname !== "/admin/security") {
    return <Navigate to="/admin/security" state={{ enroll: true }} replace />;
  }
  if (superAdminOnly && !isSuperAdmin(user)) {
    return <Navigate to="/unauthorized" state={{ reason: "forbidden" }} replace />;
  }

  return children;
};
