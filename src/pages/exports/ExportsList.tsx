import { MarketplaceNavbar } from "@/components/marketplace/MarketplaceNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useExportOpportunities } from "@/hooks/useExports";
import { formatDate } from "@/lib/format";
import { Calendar, Globe2, Loader2, MapPin, Package, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const ExportsList = () => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const { data = [], isLoading } = useExportOpportunities({
    q: q || undefined,
    destinationCountry: country || undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container py-12">
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">
            <Globe2 className="mr-1 h-3 w-3" /> {t("exports.badge")}
          </Badge>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            {t("exports.heroTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("exports.heroDesc")}
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-[2fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("exports.searchProduct")}
                className="h-11 rounded-full pl-10"
              />
            </div>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t("exports.destination")}
              className="h-11 rounded-full"
            />
            <Button asChild className="h-11 rounded-full bg-gradient-primary">
              <Link to="/auth/export-partner">{t("exports.becomePartner")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-10">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <Card className="rounded-2xl p-12 text-center text-muted-foreground">
            {t("exports.empty")}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((r) => (
              <Link key={r._id} to={`/exports/${r._id}`}>
                <Card className="group h-full rounded-2xl border-border/70 p-5 transition-base hover:-translate-y-0.5 hover:shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                        {r.destinationCountry}
                      </Badge>
                      <h3 className="mt-2 font-display text-lg font-bold">{r.productName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {r.partnerId?.companyName || r.partnerId?.name || t("exports.verifiedPartner")}
                      </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{r.status}</Badge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <Info icon={<Package className="h-3.5 w-3.5" />} label={t("exports.quantity")}
                      value={`${r.quantityRequired.toLocaleString()} ${r.unit ?? ""}`} />
                    <Info icon={<MapPin className="h-3.5 w-3.5" />} label={t("exports.pickup")}
                      value={r.pickupLocation} />
                    <Info icon={<Calendar className="h-3.5 w-3.5" />} label={t("exports.deadline")}
                      value={formatDate(r.applicationDeadline)} />
                    <Info icon={<Globe2 className="h-3.5 w-3.5" />} label={t("exports.priceRange")}
                      value={r.priceRange?.min ? `${r.priceRange.currency ?? "NGN"} ${r.priceRange.min}-${r.priceRange.max ?? ""}` : "—"} />
                  </dl>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div>
    <dt className="flex items-center gap-1 text-muted-foreground">{icon}{label}</dt>
    <dd className="mt-0.5 truncate font-medium text-foreground">{value}</dd>
  </div>
);

export default ExportsList;
