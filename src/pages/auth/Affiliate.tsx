import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sprout, Truck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  state: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  password: z.string().min(6).max(128),
});
type FormValues = z.infer<typeof schema>;

const Affiliate = () => {
  const { registerAffiliate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { from?: { pathname?: string; search?: string } };
  };
  const [params] = useSearchParams();
  const initialRole = (params.get("role") === "rider" ? "rider" : "farmer") as "farmer" | "rider";
  const [role, setRole] = useState<"farmer" | "rider">(initialRole);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const user = await registerAffiliate({
        ...(values as Required<FormValues>),
        role,
        state: values.state || undefined,
        address: values.address || undefined,
      });
      toast.success("Application received! Your account is pending verification.");
      const from = location.state?.from
        ? `${location.state.from.pathname ?? ""}${location.state.from.search ?? ""}`
        : undefined;
      navigate(from ?? `/dashboard/${user.role}`, { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Join PhyhanAgro"
      subtitle="Apply as a farmer or rider. We'll verify your account shortly after signup."
      footer={
        <>
          Just want to shop?{" "}
          <Link to="/register" state={location.state} className="font-semibold text-primary hover:underline">Create a buyer account</Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <RoleCard active={role === "farmer"} onClick={() => setRole("farmer")} icon={<Sprout className="h-5 w-5" />} label="Farmer" desc="Sell your harvest" />
        <RoleCard active={role === "rider"} onClick={() => setRole("rider")} icon={<Truck className="h-5 w-5" />} label="Rider" desc="Deliver orders" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Jane Doe" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="080..." {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" placeholder="Lagos, Oyo, ..." {...register("state")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Street, area" {...register("address")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 6 characters" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={submitting} className="h-11 w-full rounded-full bg-gradient-primary text-base font-semibold shadow-glow">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Apply as ${role}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Your account will be limited until our team approves your verification.
        </p>
      </form>
    </AuthLayout>
  );
};

const RoleCard = ({ active, onClick, icon, label, desc }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-base",
      active
        ? "border-primary bg-primary/5 shadow-card"
        : "border-border hover:border-primary/40 hover:bg-secondary",
    )}
  >
    <span className={cn(
      "flex h-9 w-9 items-center justify-center rounded-xl",
      active ? "bg-gradient-primary text-white" : "bg-secondary text-muted-foreground",
    )}>{icon}</span>
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  </button>
);

export default Affiliate;
