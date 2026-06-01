import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  useExportOpportunities,
  useMyExportApplications,
  useExportShipments,
} from "@/hooks/useExports";
import { formatDate } from "@/lib/format";
import type { ExportApplication, ExportRequest, ExportShipment } from "@/types/exports";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Globe2, Loader2, Package, Ship } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const FarmerExportCenter = () => {
  const { t } = useTranslation();
  const { data: opps = [], isLoading: lo } = useExportOpportunities();
  const { data: apps = [], isLoading: la } = useMyExportApplications();
  const { data: shipments = [], isLoading: ls } = useExportShipments();

  const oppCols = useMemo<ColumnDef<ExportRequest>[]>(() => [
    { accessorKey: "productName", header: t("exports.productName") },
    { accessorKey: "destinationCountry", header: t("exports.destination") },
    {
      accessorKey: "quantityRequired", header: t("exports.quantity"),
      cell: ({ row }) => `${row.original.quantityRequired.toLocaleString()} ${row.original.unit ?? ""}`,
    },
    {
      accessorKey: "applicationDeadline", header: t("exports.deadline"),
      cell: ({ row }) => formatDate(row.original.applicationDeadline),
    },
    {
      id: "view", header: t("common.actions"),
      cell: ({ row }) => (
        <Button asChild size="sm" variant="outline">
          <Link to={`/exports/${row.original._id}`}>{t("common.view")} <ArrowRight className="ml-1 h-3 w-3" /></Link>
        </Button>
      ),
    },
  ], [t]);

  const appCols = useMemo<ColumnDef<ExportApplication>[]>(() => [
    {
      accessorKey: "requestId", header: t("exports.requestRef"),
      cell: ({ row }) => {
        const r = row.original.requestId;
        return typeof r === "string" ? r.slice(-6) : r?.productName ?? "—";
      },
    },
    {
      accessorKey: "quantityAvailable", header: t("exports.quantityAvailable"),
      cell: ({ row }) => row.original.quantityAvailable.toLocaleString(),
    },
    {
      accessorKey: "proposedPrice", header: t("exports.proposedPrice"),
      cell: ({ row }) => `${row.original.currency ?? "NGN"} ${row.original.proposedPrice.toLocaleString()}`,
    },
    {
      accessorKey: "status", header: t("common.status"),
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.status.replace("_", " ")}</Badge>,
    },
    {
      accessorKey: "createdAt", header: t("admin.columns.date"),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ], [t]);

  const shipCols = useMemo<ColumnDef<ExportShipment>[]>(() => [
    {
      id: "shortId", header: t("admin.columns.orderId"),
      cell: ({ row }) => <span className="font-mono text-xs">#{row.original._id.slice(-6).toUpperCase()}</span>,
    },
    {
      accessorKey: "carrier", header: t("exports.carrier"),
      cell: ({ row }) => row.original.carrier ?? "—",
    },
    {
      accessorKey: "trackingReference", header: t("exports.tracking"),
      cell: ({ row }) => row.original.trackingReference ?? "—",
    },
    {
      accessorKey: "status", header: t("common.status"),
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.status.replace("_", " ")}</Badge>,
    },
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("exports.centerTitle")} description={t("exports.centerDesc")}
        action={<Button asChild className="rounded-full bg-gradient-primary"><Link to="/exports"><Globe2 className="mr-2 h-4 w-4" /> {t("exports.browseAll")}</Link></Button>} />

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<Package className="h-4 w-4" />} label={t("exports.openOpportunities")} value={opps.length} />
        <Stat icon={<Globe2 className="h-4 w-4" />} label={t("exports.myApplications")} value={apps.length} />
        <Stat icon={<Ship className="h-4 w-4" />} label={t("exports.activeShipments")} value={shipments.length} />
      </div>

      <Tabs defaultValue="opps">
        <TabsList>
          <TabsTrigger value="opps">{t("exports.opportunities")}</TabsTrigger>
          <TabsTrigger value="apps">{t("exports.myApplications")}</TabsTrigger>
          <TabsTrigger value="ships">{t("exports.shipments")}</TabsTrigger>
        </TabsList>
        <TabsContent value="opps" className="mt-4">
          {lo ? <Spin /> : <DataTable data={opps} columns={oppCols} searchableKeys={["productName", "destinationCountry"]} />}
        </TabsContent>
        <TabsContent value="apps" className="mt-4">
          {la ? <Spin /> : <DataTable data={apps} columns={appCols} searchableKeys={["status"]} />}
        </TabsContent>
        <TabsContent value="ships" className="mt-4">
          {ls ? <Spin /> : <DataTable data={shipments} columns={shipCols} searchableKeys={["status", "carrier", "trackingReference"]} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card className="rounded-2xl p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
    <p className="mt-2 font-display text-2xl font-extrabold">{value.toLocaleString()}</p>
  </Card>
);

const Spin = () => <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

export default FarmerExportCenter;
