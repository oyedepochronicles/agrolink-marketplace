import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types";
import { Loader2 } from "lucide-react";
import { hasAnyRole, isAdmin, isDeactivated, isSuspended, portalPathFor } from "@/lib/authz";

interface Props {
  children: JSX.Element;
  roles?: Role[];
  redirectTo?: string;
}

/**
 * Route guard: authentication -> account health -> role.
 * UX layer only; the backend re-checks every request.
 */
export const ProtectedRoute = ({ children, roles, redirectTo = "/login" }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to={redirectTo} state={{ from: location }} replace />;
  if (isSuspended(user) || isDeactivated(user)) {
    return <Navigate to="/unauthorized" state={{ reason: "suspended" }} replace />;
  }
  // Admins live in their own console and never render operational routes.
  if (isAdmin(user) && !(roles && hasAnyRole(user, roles))) {
    return <Navigate to="/admin" replace />;
  }
  if (roles && !hasAnyRole(user, roles)) {
    return <Navigate to={portalPathFor(user)} replace />;
  }
  return children;
};
