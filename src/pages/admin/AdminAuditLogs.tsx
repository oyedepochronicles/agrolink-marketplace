import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs, type AuditLog } from "@/hooks/useSecurity";
import { apiErrorMessage } from "@/lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

interface Row {
  id: string;
  action: string;
  actor: string;
  role: string;
  target: string;
  ip: string;
  when: string;
  raw: AuditLog;
}

const AdminAuditLogs = () => {
  const { data, isLoading, error } = useAuditLogs();

  const rows: Row[] = useMemo(
    () =>
      (data ?? []).map((l) => ({
        id: l._id,
        action: l.action ?? "—",
        actor: l.actor?.name ?? l.actor?.email ?? "System",
        role: l.actor?.role ?? l.actorRole ?? "—",
        target: [l.targetType, l.targetId].filter(Boolean).join(": ") || "—",
        ip: l.ip ?? "—",
        when: l.createdAt ? new Date(l.createdAt).toLocaleString() : "—",
        raw: l,
      })),
    [data],
  );

  const columns: ColumnDef<Row, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-full font-mono text-[11px]">
            {row.original.action}
          </Badge>
        ),
      },
      { accessorKey: "actor", header: "Actor" },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "target", header: "Target" },
      { accessorKey: "ip", header: "IP" },
      { accessorKey: "when", header: "When" },
    ],
    [],
  );

  if (isLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit trail"
        description="Every privileged action recorded by the backend, with actor, target and origin."
      />
      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{apiErrorMessage(error)}</p>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Search actions, actors, targets"
          searchableKeys={["action", "actor", "role", "target", "ip"]}
          emptyMessage="No audit entries yet."
          pageSize={15}
        />
      )}
    </div>
  );
};

export default AdminAuditLogs;
