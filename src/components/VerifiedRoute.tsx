import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props { children: JSX.Element }

/**
 * Blocks farmers/riders from operating their dashboard until verified.
 * Sends them to /verify-pending where they can check status / submit docs.
 * Marketplace stays accessible.
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

  const requiresGate = user.role === "farmer" || user.role === "rider";
  const isVerified = user.isVerified === true || user.verificationStatus === "approved";

  if (requiresGate && !isVerified) {
    return <Navigate to="/verify-pending" replace />;
  }

  return children;
};
