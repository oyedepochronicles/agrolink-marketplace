import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useExportShipments,
  useUpdateExportShipment,
} from "@/hooks/useExports";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ExportShipment, ExportShipmentStatus } from "@/types/exports";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const SHIP_STATUS: ExportShipmentStatus[] = [
  "awaiting_pickup", "processing", "in_transit", "shipped", "delivered",
];

const ExportPartnerShipments = () => {
  const { t } = useTranslation();
  const { data = [], isLoading } = useExportShipments();
  const update = useUpdateExportShipment();
  const [open, setOpen] = useState<ExportShipment | null>(null);
  const [f, setF] = useState({
    status: "" as ExportShipmentStatus | "",
    note: "", location: "", pickupDate: "", pickupLocation: "",
    carrier: "", trackingReference: "",
  });

  const start = (s: ExportShipment) => {
    setOpen(s);
    setF({
      status: s.status, note: "", location: "",
      pickupDate: s.pickupDate?.slice(0, 10) ?? "",
      pickupLocation: s.pickupLocation ?? "",
      carrier: s.carrier ?? "", trackingReference: s.trackingReference ?? "",
    });
  };

  const submit = async () => {
    if (!open) return;
    try {
      await update.mutateAsync({
        id: open._id,
        status: f.status || undefined,
        note: f.note || undefined,
        location: f.location || undefined,
        pickupDate: f.pickupDate ? new Date(f.pickupDate).toISOString() : undefined,
        pickupLocation: f.pickupLocation || undefined,
        carrier: f.carrier || undefined,
        trackingReference: f.trackingReference || undefined,
      });
      toast.success(t("exports.shipmentUpdated"));
      setOpen(null);
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const columns = useMemo<ColumnDef<ExportShipment>[]>(() => [
    {
      id: "shortId", header: t("admin.columns.orderId"),
      cell: ({ row }) => <span className="font-mono text-xs">#{row.original._id.slice(-6).toUpperCase()}</span>,
    },
    {
      accessorKey: "farmerId", header: t("exports.farmer"),
      cell: ({ row }) => row.original.farmerId?.name ?? "—",
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
      accessorKey: "pickupDate", header: t("exports.pickupDate"),
      cell: ({ row }) => row.original.pickupDate ? formatDate(row.original.pickupDate) : "—",
    },
    {
      accessorKey: "status", header: t("common.status"),
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.status.replace("_", " ")}</Badge>,
    },
    {
      id: "actions", header: t("common.actions"),
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => start(row.original)}>
          {t("exports.update")}
        </Button>
      ),
    },
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("exports.shipments")} description={t("exports.shipmentsDesc")} />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable data={data} columns={columns} searchableKeys={["status", "carrier", "trackingReference"]} />
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("exports.updateShipment")}</DialogTitle></DialogHeader>
          <div className="grid gap-3 text-sm">
            <div>
              <Label>{t("common.status")}</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as ExportShipmentStatus })}>
                <SelectTrigger><SelectValue placeholder={t("common.status")} /></SelectTrigger>
                <SelectContent>
                  {SHIP_STATUS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("exports.carrier")}</Label><Input value={f.carrier} onChange={(e) => setF({ ...f, carrier: e.target.value })} /></div>
              <div><Label>{t("exports.tracking")}</Label><Input value={f.trackingReference} onChange={(e) => setF({ ...f, trackingReference: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("exports.pickupDate")}</Label><Input type="date" value={f.pickupDate} onChange={(e) => setF({ ...f, pickupDate: e.target.value })} /></div>
              <div><Label>{t("exports.location")}</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
            </div>
            <div><Label>{t("exports.pickup")}</Label><Input value={f.pickupLocation} onChange={(e) => setF({ ...f, pickupLocation: e.target.value })} /></div>
            <div><Label>{t("exports.note")}</Label><Textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>{t("common.cancel")}</Button>
            <Button onClick={submit} disabled={update.isPending} className="bg-gradient-primary">
              {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExportPartnerShipments;
