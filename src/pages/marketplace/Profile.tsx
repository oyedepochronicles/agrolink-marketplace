import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import { LogOut, Mail, Phone, ShieldCheck } from "lucide-react";

const Profile = () => {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="container max-w-3xl py-10">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="bg-gradient-hero p-8 text-white">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/30">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-white/10 text-lg font-bold text-white">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-2xl font-extrabold">{user.name}</h1>
              <p className="text-sm capitalize text-white/80">{user.role} account</p>
            </div>
          </div>
        </div>
        <div className="space-y-4 p-8">
          <Row icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
          {user.phone && <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone} />}
          {user.state && <Row icon={<ShieldCheck className="h-4 w-4" />} label="State" value={user.state} />}
          <div className="flex justify-end pt-4">
            <Button onClick={logout} variant="outline" className="rounded-full">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">{icon}</span>
      {label}
    </div>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);

export default Profile;
