import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentActivity } from "@/hooks/useAgentPortal";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { refLabel, type AgentActivityItem } from "@/types/agents";
import type { ColumnDef } from "@tanstack/react-table";

/** Turn a dotted action key (e.g. "product.status_change") into a readable label. */
const humanizeAction = (action: string) =>
  action
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const AgentActivity = () => {
  const { data: items, isLoading, error } = useAgentActivity(100);

  const columns: ColumnDef<AgentActivityItem, unknown>[] = [
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="font-medium">{humanizeAction(row.original.action)}</p>
          {row.original.targetType && (
            <p className="text-xs capitalize text-muted-foreground">
              {row.original.targetType}
              {row.original.targetId ? ` · #${row.original.targetId.slice(-6)}` : ""}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "farmer",
      header: "Farmer",
      cell: ({ row }) =>
        row.original.farmerId ? (
          <span className="text-sm">{refLabel(row.original.farmerId)}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "outcome",
      header: "Outcome",
      cell: ({ row }) => {
        const failed = row.original.outcome === "failure";
        return (
          <Badge
            variant="outline"
            className={
              failed
                ? "rounded-full border-transparent bg-destructive/10 text-destructive"
                : "rounded-full border-transparent bg-primary/10 text-primary"
            }
          >
            {failed ? "Failed" : "Success"}
            {row.original.statusCode ? ` · ${row.original.statusCode}` : ""}
          </Badge>
        );
      },
    },
    {
      id: "time",
      header: "When",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="An immutable record of every action you have taken — on your own account and on behalf of the farmers you serve."
      />

      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {apiErrorMessage(error)}
        </p>
      ) : isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : (
        <DataTable
          data={items ?? []}
          columns={columns}
          searchPlaceholder="Search activity"
          searchableKeys={["action"]}
          emptyMessage="No activity recorded yet."
        />
      )}
    </div>
  );
};

export default AgentActivity;
