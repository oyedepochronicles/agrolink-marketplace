import { useAuth } from "@/contexts/AuthContext";
import { portalPathFor } from "@/lib/authz";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  return <Navigate to={user ? portalPathFor(user) : "/marketplace"} replace />;
};

export default Index;
