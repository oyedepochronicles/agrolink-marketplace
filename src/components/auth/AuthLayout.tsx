import { Link } from "react-router-dom";
import heroImage from "@/assets/marketplace-hero.jpg";
import { Brand } from "@/components/Brand";

export const AuthLayout = ({
  title, subtitle, children, footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form */}
      <div className="flex flex-col bg-background">
        <header className="container flex h-16 items-center justify-between">
          <Brand to="/login" />
          <Link to="/marketplace" className="text-sm font-medium text-muted-foreground transition-base hover:text-primary">
            Browse marketplace →
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-md animate-fade-in-up space-y-6">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="pt-2 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </div>

      {/* Visual */}
      <aside className="relative hidden overflow-hidden lg:block">
        <img
          src={heroImage}
          alt="Fresh Nigerian farm produce"
          className="absolute inset-0 h-full w-full object-cover"
          width={1600}
          height={1024}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">PhyhanAgro</p>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            From the farm.<br />Straight to your door.
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/80">
            Verified farmers. Trusted riders. Real-time chat. Built for the Nigerian agricultural economy.
          </p>
        </div>
      </aside>
    </div>
  );
};
