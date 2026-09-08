import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSecurityEvents, type SecurityEvent } from "@/hooks/useSecurity";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

interface Row {
  id: string;
  type: string;
  severity: string;
  who: string;
  ip: string;
  message: string;
  when: string;
  raw: SecurityEvent;
}

const SEVERITY: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning-foreground",
  high: "bg-destructive/15 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

const AdminSecurityEvents = () => {
  const { data, isLoading, error } = useSecurityEvents();

  const rows: Row[] = useMemo(
    () =>
      (data ?? []).map((e) => ({
        id: e._id,
        type: e.type ?? "—",
        severity: e.severity ?? "low",
        who: e.user?.email ?? e.email ?? "Unknown",
        ip: e.ip ?? "—",
        message: e.message ?? "—",
        when: e.createdAt ? new Date(e.createdAt).toLocaleString() : "—",
        raw: e,
      })),
    [data],
  );

  const columns: ColumnDef<Row, unknown>[] = useMemo(
    () => [
      { accessorKey: "type", header: "Event" },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("rounded-full border-transparent capitalize", SEVERITY[row.original.severity] ?? SEVERITY.low)}
          >
            {row.original.severity}
          </Badge>
        ),
      },
      { accessorKey: "who", header: "Account" },
      { accessorKey: "ip", header: "IP" },
      { accessorKey: "message", header: "Detail" },
      { accessorKey: "when", header: "When" },
    ],
    [],
  );

  if (isLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security events"
        description="Failed logins, MFA failures, blocked access attempts and other suspicious activity."
      />
      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{apiErrorMessage(error)}</p>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Search events, accounts, IPs"
          searchableKeys={["type", "severity", "who", "ip", "message"]}
          emptyMessage="No security events recorded."
          pageSize={15}
        />
      )}
    </div>
  );
};

export default AdminSecurityEvents;
