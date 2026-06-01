import { DataTable } from "@/components/dashboard/DataTable";
import { ExportRequestDialog } from "@/components/dashboard/ExportRequestDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteExportRequest,
  useMyExportRequests,
  useUpdateExportRequestStatus,
} from "@/hooks/useExports";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ExportRequest } from "@/types/exports";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const ExportPartnerRequests = () => {
  const { t } = useTranslation();
  const { data = [], isLoading } = useMyExportRequests();
  const updateStatus = useUpdateExportRequestStatus();
  const del = useDeleteExportRequest();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExportRequest | null>(null);

  const columns = useMemo<ColumnDef<ExportRequest>[]>(() => [
    { accessorKey: "productName", header: t("exports.productName") },
    { accessorKey: "destinationCountry", header: t("exports.destination") },
    {
      accessorKey: "quantityRequired",
      header: t("exports.quantity"),
      cell: ({ row }) => `${row.original.quantityRequired.toLocaleString()} ${row.original.unit ?? ""}`,
    },
    {
      accessorKey: "applicationDeadline",
      header: t("exports.deadline"),
      cell: ({ row }) => formatDate(row.original.applicationDeadline),
    },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.status}</Badge>,
    },
    {
      accessorKey: "moderationStatus",
      header: t("exports.moderation"),
      cell: ({ row }) => {
        const m = row.original.moderationStatus;
        const cls = m === "approved" ? "border-primary/30 bg-primary/10 text-primary"
          : m === "rejected" ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-warning/30 bg-warning/10 text-warning-foreground";
        return <Badge variant="outline" className={cls}>{m}</Badge>;
      },
    },
    {
      id: "actions",
      header: t("common.actions"),
      cell: ({ row }) => {
        const r = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditing(r); setOpen(true); }}>
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                try { await updateStatus.mutateAsync({ id: r._id, status: r.status === "closed" ? "open" : "closed" }); }
                catch (e) { toast.error(apiErrorMessage(e)); }
              }}>
                {r.status === "closed" ? t("exports.reopen") : t("exports.close")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                try { await updateStatus.mutateAsync({ id: r._id, status: "fulfilled" }); }
                catch (e) { toast.error(apiErrorMessage(e)); }
              }}>
                {t("exports.markFulfilled")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={async () => {
                try { await del.mutateAsync(r._id); toast.success(t("exports.deleted")); }
                catch (e) { toast.error(apiErrorMessage(e)); }
              }}>
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [t, updateStatus, del]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("exports.myRequests")} description={t("exports.myRequestsDesc")}
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full bg-gradient-primary">
            <Plus className="mr-2 h-4 w-4" /> {t("exports.newRequest")}
          </Button>
        } />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable data={data} columns={columns}
          searchableKeys={["productName", "destinationCountry", "status", "moderationStatus"]} />
      )}
      <ExportRequestDialog open={open} onOpenChange={setOpen} existing={editing} />
    </div>
  );
};

export default ExportPartnerRequests;
