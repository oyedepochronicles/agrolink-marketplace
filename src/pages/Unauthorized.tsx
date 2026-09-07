import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { portalPathFor } from "@/lib/authz";
import { ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface Props {
  reason?: "forbidden" | "network" | "suspended" | "mfa";
}

const COPY: Record<NonNullable<Props["reason"]>, { title: string; body: string }> = {
  forbidden: {
    title: "Access denied",
    body: "Your account does not have permission to access this area.",
  },
  network: {
    title: "Restricted network",
    body: "Admin access is restricted to the approved network. Connect through the approved VPN or office network and try again.",
  },
  suspended: {
    title: "Account restricted",
    body: "Your account is currently restricted. Please contact support for assistance.",
  },
  mfa: {
    title: "Additional verification required",
    body: "Multi-factor authentication must be completed before you can continue.",
  },
};

const Unauthorized = ({ reason }: Props) => {
  const { user } = useAuth();
  const location = useLocation() as { state?: { reason?: Props["reason"] } };
  const key = reason ?? location.state?.reason ?? "forbidden";
  const copy = COPY[key];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to={portalPathFor(user)}>Go to my portal</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/marketplace/support">Contact support</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Unauthorized;
