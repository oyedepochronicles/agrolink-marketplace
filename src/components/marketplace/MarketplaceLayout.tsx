import { Outlet } from "react-router-dom";
import { MarketplaceNavbar } from "./MarketplaceNavbar";
import { Brand } from "@/components/Brand";
import { Link } from "react-router-dom";

export const MarketplaceLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplaceNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-border bg-secondary/40">
        <div className="container grid gap-8 py-12 md:grid-cols-4">
          <div className="space-y-3">
            <Brand to="/marketplace" />
            <p className="max-w-xs text-sm text-muted-foreground">
              Direct from Nigerian farms. Buy fresh produce, support real farmers, and get it delivered by trusted riders.
            </p>
          </div>
          <FooterCol title="Marketplace" links={[
            { to: "/marketplace", label: "Home" },
            { to: "/marketplace/search", label: "Browse all" },
            { to: "/marketplace/cart", label: "Cart" },
          ]} />
          <FooterCol title="Sell with us" links={[
            { to: "/affiliate", label: "Become a farmer" },
            { to: "/affiliate?role=rider", label: "Join as rider" },
            { to: "/login", label: "Sign in" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/marketplace", label: "About" },
            { to: "/marketplace", label: "Help" },
            { to: "/marketplace", label: "Privacy" },
          ]} />
        </div>
        <div className="border-t border-border">
          <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground md:flex-row">
            <p>© {new Date().getFullYear()} PhyhanAgro. All rights reserved.</p>
            <p>Made with care for Nigerian agriculture.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FooterCol = ({ title, links }: { title: string; links: { to: string; label: string }[] }) => (
  <div>
    <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
    <ul className="space-y-2 text-sm text-muted-foreground">
      {links.map((l) => (
        <li key={l.label}>
          <Link to={l.to} className="transition-base hover:text-primary">{l.label}</Link>
        </li>
      ))}
    </ul>
  </div>
);
