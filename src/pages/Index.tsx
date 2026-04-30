import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/marketplace" replace />;
  if (user.role === "buyer") return <Navigate to="/marketplace" replace />;
  return <Navigate to={`/dashboard/${user.role}`} replace />;
};

export default Index;
