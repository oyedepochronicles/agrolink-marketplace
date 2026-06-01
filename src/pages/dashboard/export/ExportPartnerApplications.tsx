import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  usePartnerExportApplications,
  useReviewExportApplication,
  useStartExportConversation,
} from "@/hooks/useExports";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ExportApplication } from "@/types/exports";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Loader2, MessageSquare, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ExportPartnerApplications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data = [], isLoading } = usePartnerExportApplications();
  const review = useReviewExportApplication();
  const startConv = useStartExportConversation();
  const [open, setOpen] = useState<ExportApplication | null>(null);
  const [note, setNote] = useState("");

  const act = async (status: "accepted" | "rejected" | "under_review") => {
    if (!open) return;
    try {
      await review.mutateAsync({ id: open._id, status, reviewNote: note || undefined });
      toast.success(t("exports.applicationReviewed"));
      setOpen(null); setNote("");
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const columns = useMemo<ColumnDef<ExportApplication>[]>(() => [
    {
      accessorKey: "farmerId",
      header: t("exports.farmer"),
      cell: ({ row }) => row.original.farmerId?.name ?? "—",
    },
    {
      accessorKey: "requestId",
      header: t("exports.requestRef"),
      cell: ({ row }) => {
        const r = row.original.requestId;
        return typeof r === "string" ? r.slice(-6) : (r?.productName ?? "—");
      },
    },
    {
      accessorKey: "quantityAvailable",
      header: t("exports.quantityAvailable"),
      cell: ({ row }) => row.original.quantityAvailable.toLocaleString(),
    },
    {
      accessorKey: "proposedPrice",
      header: t("exports.proposedPrice"),
      cell: ({ row }) => `${row.original.currency ?? "NGN"} ${row.original.proposedPrice.toLocaleString()}`,
    },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.status.replace("_", " ")}</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: t("admin.columns.date"),
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      header: t("common.actions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => { setOpen(row.original); setNote(row.original.reviewNote ?? ""); }}>
            {t("common.view")}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" title={t("dashboard.messages")} onClick={async () => {
            try {
              const conv = await startConv.mutateAsync(row.original._id);
              navigate(`/dashboard/export/messages?conversation=${conv._id}`);
            } catch (e) { toast.error(apiErrorMessage(e)); }
          }}>
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [t, navigate, startConv]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("exports.applications")} description={t("exports.applicationsDesc")} />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable data={data} columns={columns}
          searchableKeys={["status"]} />
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("exports.reviewApplication")}</DialogTitle></DialogHeader>
          {open && (
            <div className="space-y-3 text-sm">
              <Row k={t("exports.farmer")} v={open.farmerId?.name ?? "—"} />
              <Row k={t("exports.quantityAvailable")} v={open.quantityAvailable.toLocaleString()} />
              <Row k={t("exports.proposedPrice")} v={`${open.currency ?? "NGN"} ${open.proposedPrice.toLocaleString()}`} />
              <Row k={t("exports.harvestDetails")} v={open.harvestDetails} />
              {open.qualityNotes && <Row k={t("exports.qualityNotes")} v={open.qualityNotes} />}
              {open.packagingReadiness && <Row k={t("exports.packagingReadiness")} v={open.packagingReadiness} />}
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("exports.reviewNote")}</p>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => act("under_review")} disabled={review.isPending}>
              {t("exports.markUnderReview")}
            </Button>
            <Button variant="outline" className="text-destructive" onClick={() => act("rejected")} disabled={review.isPending}>
              <X className="mr-2 h-4 w-4" /> {t("exports.reject")}
            </Button>
            <Button className="bg-gradient-primary" onClick={() => act("accepted")} disabled={review.isPending}>
              <Check className="mr-2 h-4 w-4" /> {t("exports.accept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground">{k}</span>
    <span className="text-right font-medium">{v}</span>
  </div>
);

export default ExportPartnerApplications;
