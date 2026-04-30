import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types";
import { Loader2 } from "lucide-react";

interface Props {
  children: JSX.Element;
  roles?: Role[];
  redirectTo?: string;
}

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
  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === "buyer" ? "/marketplace" : `/dashboard/${user.role}`;
    return <Navigate to={fallback} replace />;
  }
  return children;
};
