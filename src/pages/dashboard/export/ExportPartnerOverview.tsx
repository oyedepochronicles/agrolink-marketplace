import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useExportPartnerOverview } from "@/hooks/useExports";
import { formatDate } from "@/lib/format";
import {
  Globe2,
  Loader2,
  PackageCheck,
  PackageOpen,
  Ship,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const ExportPartnerOverview = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading } = useExportPartnerOverview();
  const c = data?.cards;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          {t("exports.welcome", { name: user?.name.split(" ")[0] })}
        </h2>
        <p className="text-sm text-muted-foreground">{t("exports.overviewSub")}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <Stat icon={<PackageOpen className="h-4 w-4" />} label={t("exports.totalRequests")} value={c?.totalRequests ?? 0} />
            <Stat icon={<Globe2 className="h-4 w-4" />} label={t("exports.openRequests")} value={c?.openRequests ?? 0} />
            <Stat icon={<Users className="h-4 w-4" />} label={t("exports.applications")} value={c?.applications ?? 0} />
            <Stat icon={<PackageCheck className="h-4 w-4" />} label={t("exports.accepted")} value={c?.acceptedApplications ?? 0} />
            <Stat icon={<Ship className="h-4 w-4" />} label={t("exports.activeShipments")} value={c?.activeShipments ?? 0} />
          </div>

          <Card className="rounded-2xl p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{t("exports.recentRequests")}</h3>
              <Link className="text-sm text-primary hover:underline" to="/dashboard/export/requests">
                {t("common.view")}
              </Link>
            </div>
            {data && data.requests.length > 0 ? (
              <ul className="divide-y divide-border">
                {data.requests.slice(0, 6).map((r) => (
                  <li key={r._id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{r.productName}</p>
                      <p className="text-xs text-muted-foreground">{r.destinationCountry} • {formatDate(r.applicationDeadline)}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{r.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("exports.empty")}</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card className="rounded-2xl p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
    <p className="mt-2 font-display text-2xl font-extrabold">{value.toLocaleString()}</p>
  </Card>
);

export default ExportPartnerOverview;
