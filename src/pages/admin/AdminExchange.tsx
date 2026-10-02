// Admin Farm Exchange moderation. The admin oversees the farmer<->farmer exchange
// but never transacts in it: the only mutation here is suspend / reinstate a
// listing (adminStatus active|inactive), gated by `exchange:moderate` and audited
// server-side (MODERATE_EXCHANGE_LISTING). Reads need `exchange:read`.
//
// The admin sees the seller's by-product DECLARATION verbatim — the platform makes
// no classification of its own, so moderation is a human judgement, not a rule.
import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdminExchangeListings,
  useModerateExchangeListing,
} from "@/hooks/useAdminExchange";
import { apiErrorMessage } from "@/lib/api";
import { hasPermission } from "@/lib/authz";
import { formatDate, formatNaira } from "@/lib/format";
import {
  EXCHANGE_CATEGORIES,
  type ExchangeListing,
} from "@/types/exchange";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Leaf, MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const LISTING_STATUS_STYLE: Record<string, string> = {
  available: "rounded-full border-transparent bg-primary/10 text-primary",
  reserved: "rounded-full border-transparent bg-amber-500/10 text-amber-600",
  sold: "rounded-full border-transparent bg-muted text-muted-foreground",
  expired: "rounded-full border-transparent bg-muted text-muted-foreground",
};

const ADMIN_STATUS_FILTERS = ["all", "active", "inactive"] as const;

const AdminExchange = () => {
  const { user } = useAuth();
  const canModerate = hasPermission(user, "exchange:moderate");

  const [adminStatus, setAdminStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [detail, setDetail] = useState<ExchangeListing | null>(null);

  const params = useMemo(
    () => ({
      adminStatus:
        adminStatus === "all"
          ? undefined
          : (adminStatus as "active" | "inactive"),
      category: category === "all" ? undefined : category,
      limit: 100,
    }),
    [adminStatus, category],
  );

  const { data, isLoading, error } = useAdminExchangeListings(params);
  const moderate = useModerateExchangeListing();

  const runModerate = async (
    listing: ExchangeListing,
    next: "active" | "inactive",
  ) => {
    try {
      await moderate.mutateAsync({ id: listing._id, adminStatus: next });
      toast.success(next === "inactive" ? "Listing suspended" : "Listing reinstated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const columns: ColumnDef<ExchangeListing, unknown>[] = [
    {
      id: "listing",
      header: "Listing",
      cell: ({ row }) => {
        const l = row.original;
        return (
          <div className="min-w-[200px]">
            <p className="font-medium">{l.name}</p>
            <p className="text-xs text-muted-foreground">{l.category}</p>
          </div>
        );
      },
    },
    {
      id: "farmer",
      header: "Seller",
      cell: ({ row }) => {
        const f = row.original.farmer;
        return (
          <div className="min-w-[140px]">
            <p className="text-sm">{f?.name ?? "—"}</p>
            {f?.state && <p className="text-xs text-muted-foreground">{f.state}</p>}
          </div>
        );
      },
    },
    {
      id: "price",
      header: "Price",
      cell: ({ row }) => {
        const l = row.original;
        return (
          <span className="text-sm">
            {l.pricingType === "free" || !l.price ? "Free" : formatNaira(l.price)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={LISTING_STATUS_STYLE[row.original.status] ?? "rounded-full"}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "adminStatus",
      header: "Moderation",
      cell: ({ row }) =>
        row.original.adminStatus === "inactive" ? (
          <Badge variant="destructive">Suspended</Badge>
        ) : (
          <Badge variant="outline" className="rounded-full">
            Active
          </Badge>
        ),
    },
    {
      id: "flags",
      header: "Flags",
      cell: ({ row }) =>
        row.original.byproduct?.notForHumanConsumption ? (
          <span
            className="flex items-center gap-1 text-xs text-amber-600"
            title="Seller declared: not for human consumption"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> NFHC
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "listed",
      header: "Listed",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const l = row.original;
        const suspended = l.adminStatus === "inactive";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Listing actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetail(l)}>
                View details
              </DropdownMenuItem>
              {canModerate &&
                (suspended ? (
                  <DropdownMenuItem
                    disabled={moderate.isPending}
                    onClick={() => runModerate(l, "active")}
                  >
                    Reinstate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-destructive"
                    disabled={moderate.isPending}
                    onClick={() => runModerate(l, "inactive")}
                  >
                    Suspend
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farm Exchange"
        description="Moderate the farmer-to-farmer by-product marketplace. Suspending a listing hides it from other farmers. PhyhanAgro does not classify by-products — safety notes below are the seller's own declaration."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Moderation</Label>
          <Select value={adminStatus} onValueChange={setAdminStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_STATUS_FILTERS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "all" ? "All listings" : s === "active" ? "Active" : "Suspended"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All categories</SelectItem>
              {EXCHANGE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {apiErrorMessage(error)}
        </p>
      ) : isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : (
        <DataTable
          data={data?.items ?? []}
          columns={columns}
          searchPlaceholder="Search by name or category"
          searchableKeys={["name", "category"]}
          emptyMessage="No exchange listings found."
        />
      )}

      {detail && (
        <ListingDetailDialog listing={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
};

const ListingDetailDialog = ({
  listing,
  onClose,
}: {
  listing: ExchangeListing;
  onClose: () => void;
}) => {
  const bp = listing.byproduct;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            {listing.name}
          </DialogTitle>
          <DialogDescription>
            {listing.category} ·{" "}
            {listing.pricingType === "free" || !listing.price
              ? "Free"
              : formatNaira(listing.price)}{" "}
            · {listing.quantity} {listing.unit}
          </DialogDescription>
        </DialogHeader>

        {listing.images?.[0] && (
          <div className="h-44 w-full overflow-hidden rounded-xl">
            <img
              src={listing.images[0]}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {listing.description && (
          <p className="text-sm text-muted-foreground">{listing.description}</p>
        )}

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Seller
            </p>
            <p>{listing.farmer?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </p>
            <p>
              {[listing.location?.lga, listing.location?.state]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Listing status
            </p>
            <p className="capitalize">{listing.status}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Moderation
            </p>
            <p>{listing.adminStatus === "inactive" ? "Suspended" : "Active"}</p>
          </div>
        </div>

        {(bp?.suggestedUse || bp?.safetyNote || bp?.notForHumanConsumption) && (
          <div className="space-y-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Seller's by-product declaration
            </p>
            {bp?.notForHumanConsumption && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> Not for human consumption
              </Badge>
            )}
            {bp?.suggestedUse && (
              <p>
                <span className="font-medium">Suggested use: </span>
                {bp.suggestedUse}
              </p>
            )}
            {bp?.safetyNote && (
              <p>
                <span className="font-medium">Handling note: </span>
                {bp.safetyNote}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Declared by the seller. PhyhanAgro has not verified or classified this.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminExchange;
