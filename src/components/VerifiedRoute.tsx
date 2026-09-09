import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isVerified, requiresVerification } from "@/lib/authz";

interface Props { children: JSX.Element }

/**
 * Blocks operational roles (farmer / rider / affiliate) from their dashboard
 * until the backend reports an approved verification. Marketplace stays open.
 */
export const VerifiedRoute = ({ children }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requiresVerification(user) && !isVerified(user)) {
    return <Navigate to="/verify-pending" replace />;
  }
  return children;
};
