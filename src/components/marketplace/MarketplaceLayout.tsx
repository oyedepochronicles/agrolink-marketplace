import { Brand } from "@/components/Brand";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MarketplaceNavbar } from "./MarketplaceNavbar";

export const MarketplaceLayout = () => {
  const { t } = useTranslation();
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
              {t("footer.tagline")}
            </p>
          </div>
          <FooterCol
            title={t("footer.marketplace")}
            links={[
              { to: "/marketplace", label: t("footer.home") },
              { to: "/marketplace/search", label: t("footer.browseAll") },
              { to: "/marketplace/cart", label: t("footer.cart") },
            ]}
          />
          <FooterCol
            title={t("footer.sellWithUs")}
            links={[
              { to: "/sales", label: t("footer.becomeFarmer") },
              { to: "/affiliate?role=rider", label: t("footer.joinRider") },
              { to: "/login", label: t("footer.signIn") },
            ]}
          />
          <FooterCol
            title={t("footer.company")}
            links={[
              { to: "/marketplace", label: t("footer.about") },
              { to: "/marketplace", label: t("footer.help") },
              { to: "/marketplace", label: t("footer.privacy") },
            ]}
          />
        </div>
        <div className="border-t border-border">
          <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground md:flex-row">
            <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
            <p>{t("footer.madeWith")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FooterCol = ({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) => (
  <div>
    <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
    <ul className="space-y-2 text-sm text-muted-foreground">
      {links.map((l) => (
        <li key={l.label}>
          <Link to={l.to} className="transition-base hover:text-primary">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);
