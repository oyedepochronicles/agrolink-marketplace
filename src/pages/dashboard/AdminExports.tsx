import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminExportOverview,
  useAdminExportPartners,
  useAdminExportRequests,
  useReviewExportPartner,
  useUpdateExportRequestStatus,
} from "@/hooks/useExports";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { User } from "@/types";
import type { ExportRequest } from "@/types/exports";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Check, Globe2, Loader2, PackageOpen, Ship, Users, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const AdminExports = () => {
  const { t } = useTranslation();
  const { data: overview } = useAdminExportOverview();
  const { data: partners = [], isLoading: lp } = useAdminExportPartners();
  const { data: requests = [], isLoading: lr } = useAdminExportRequests();
  const review = useReviewExportPartner();
  const setStatus = useUpdateExportRequestStatus();
  const [partner, setPartner] = useState<User | null>(null);
  const [reason, setReason] = useState("");

  const c = overview?.cards;

  const partnerCols = useMemo<ColumnDef<User>[]>(() => [
    { accessorKey: "name", header: t("exports.companyName") },
    { accessorKey: "email", header: t("admin.columns.email") },
    { accessorKey: "phone", header: t("auth.phone") },
    {
      accessorKey: "verificationStatus", header: t("admin.columns.verification"),
      cell: ({ row }) => {
        const v = row.original.verificationStatus;
        const cls = v === "approved" ? "border-primary/30 bg-primary/10 text-primary"
          : v === "rejected" ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-warning/30 bg-warning/10 text-warning-foreground";
        return <Badge variant="outline" className={cls}>{v ?? "pending"}</Badge>;
      },
    },
    {
      id: "actions", header: t("common.actions"),
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => { setPartner(row.original); setReason(""); }}>
          {t("common.view")}
        </Button>
      ),
    },
  ], [t]);

  const reqCols = useMemo<ColumnDef<ExportRequest>[]>(() => [
    { accessorKey: "productName", header: t("exports.productName") },
    {
      id: "partner", header: t("exports.partner"),
      cell: ({ row }) => row.original.partnerId?.name ?? "—",
    },
    { accessorKey: "destinationCountry", header: t("exports.destination") },
    {
      accessorKey: "status", header: t("common.status"),
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.status}</Badge>,
    },
    {
      accessorKey: "moderationStatus", header: t("exports.moderation"),
      cell: ({ row }) => {
        const m = row.original.moderationStatus;
        const cls = m === "approved" ? "border-primary/30 bg-primary/10 text-primary"
          : m === "rejected" ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-warning/30 bg-warning/10 text-warning-foreground";
        return <Badge variant="outline" className={cls}>{m}</Badge>;
      },
    },
    {
      accessorKey: "createdAt", header: t("admin.columns.date"),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions", header: t("common.actions"),
      cell: ({ row }) => {
        const r = row.original;
        const decide = async (m: "approved" | "rejected") => {
          try { await setStatus.mutateAsync({ id: r._id, moderationStatus: m }); toast.success(t("exports.moderationUpdated")); }
          catch (e) { toast.error(apiErrorMessage(e)); }
        };
        return (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="text-primary" onClick={() => decide("approved")}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => decide("rejected")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [t, setStatus]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("exports.adminTitle")} description={t("exports.adminDesc")} />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Stat icon={<Users className="h-4 w-4" />} label={t("exports.pendingPartners")} value={c?.pendingPartners ?? 0} />
        <Stat icon={<Globe2 className="h-4 w-4" />} label={t("exports.totalPartners")} value={c?.totalPartners ?? 0} />
        <Stat icon={<PackageOpen className="h-4 w-4" />} label={t("exports.openRequests")} value={c?.openRequests ?? 0} />
        <Stat icon={<Users className="h-4 w-4" />} label={t("exports.applications")} value={c?.applications ?? 0} />
        <Stat icon={<Ship className="h-4 w-4" />} label={t("exports.activeShipments")} value={c?.activeShipments ?? 0} />
      </div>

      <Tabs defaultValue="partners">
        <TabsList>
          <TabsTrigger value="partners">{t("exports.partners")}</TabsTrigger>
          <TabsTrigger value="requests">{t("exports.requests")}</TabsTrigger>
        </TabsList>
        <TabsContent value="partners" className="mt-4">
          {lp ? <Spin /> : <DataTable data={partners} columns={partnerCols} searchableKeys={["name", "email", "verificationStatus"]} />}
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          {lr ? <Spin /> : <DataTable data={requests} columns={reqCols} searchableKeys={["productName", "destinationCountry", "status", "moderationStatus"]} />}
        </TabsContent>
      </Tabs>

      <Dialog open={!!partner} onOpenChange={(o) => !o && setPartner(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("exports.reviewPartner")}</DialogTitle></DialogHeader>
          {partner && (
            <div className="space-y-3 text-sm">
              <Row k={t("exports.companyName")} v={partner.name} />
              <Row k={t("admin.columns.email")} v={partner.email} />
              <Row k={t("auth.phone")} v={partner.phone ?? "—"} />
              <Row k={t("admin.columns.verification")} v={partner.verificationStatus ?? "pending"} />
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("exports.decisionReason")}</p>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="text-destructive" disabled={review.isPending}
              onClick={async () => {
                if (!partner) return;
                try { await review.mutateAsync({ id: partner._id, decision: "reject", reason }); toast.success(t("exports.partnerRejected")); setPartner(null); }
                catch (e) { toast.error(apiErrorMessage(e)); }
              }}>
              <X className="mr-2 h-4 w-4" /> {t("exports.reject")}
            </Button>
            <Button className="bg-gradient-primary" disabled={review.isPending}
              onClick={async () => {
                if (!partner) return;
                try { await review.mutateAsync({ id: partner._id, decision: "approve", reason }); toast.success(t("exports.partnerApproved")); setPartner(null); }
                catch (e) { toast.error(apiErrorMessage(e)); }
              }}>
              <Check className="mr-2 h-4 w-4" /> {t("exports.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card className="rounded-2xl p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
    <p className="mt-2 font-display text-2xl font-extrabold">{value.toLocaleString()}</p>
  </Card>
);

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground">{k}</span>
    <span className="text-right font-medium">{v}</span>
  </div>
);

const Spin = () => <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

export default AdminExports;
