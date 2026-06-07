import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
  useUpdateAnnouncementStatus,
} from "@/hooks/useAdminAnnouncements";
import { useUploadImage } from "@/hooks/useFarmerProducts";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type {
  Announcement,
  AnnouncementRole,
  AnnouncementType,
} from "@/types/announcement";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreVertical, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const AdminAnnouncements = () => {
  const { data: rows = [], isLoading } = useAdminAnnouncements();
  const setStatus = useUpdateAnnouncementStatus();
  const del = useDeleteAnnouncement();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create" | null>(null);
  const [active, setActive] = useState<Announcement | null>(null);

  const updateStatus = async (id: string, status: boolean) => {
    try {
      await setStatus.mutateAsync({ id, isActive: status });
      toast.success("Announcement updated");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const remove = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Deleted");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };
  const columns = useMemo<ColumnDef<Announcement>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex min-w-[220px] items-center gap-2">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                {a.banner?.[0] ? (
                  <img
                    src={a.banner[0]}
                    alt={row.original.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <span className="truncate font-medium">{row.original.title}</span>
            </div>
          );
        },
      },

      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.type}
          </Badge>
        ),
      },

      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },

      {
        accessorKey: "targetRole",
        header: "Target",
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {row.original.targetRole}
          </Badge>
        ),
      },

      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdAt}
          </span>
        ),
      },

      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setMode("view");
                  setActive(row.original);
                  setOpen(true);
                }}
              >
                View details
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setMode("edit");
                  setActive(row.original);
                  setOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive"
                onClick={() => remove(row.original._id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Broadcast updates to buyers, farmers, riders, and partners."
        action={
          <Button
            className="gap-1"
            onClick={() => {
              setMode("create");
              setActive(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-2xl p-6 text-sm text-muted-foreground">
          No announcements yet.
        </Card>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchableKeys={["title", "type", "isActive", "targetRole"]}
          onRowClick={(row) => {
            setActive(row);
          }}
        />
      )}
      <Dialog open={mode !== null} onOpenChange={() => setMode(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "view" && "Announcement Details"}
              {mode === "edit" && "Edit Announcement"}
              {mode === "create" && "New Announcement"}
            </DialogTitle>
          </DialogHeader>

          {mode === "view" && active && <AnnouncementDetails d={active} />}

          {(mode === "edit" || mode === "create") && (
            <NewAnnouncementForm
              editItem={mode === "edit" ? active : null}
              onDone={() => setMode(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
const AnnouncementDetails = ({ d }: { d: Announcement }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{d.message}</p>

      {d.banner?.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {d.banner.map((img: string) => (
            <img
              key={img}
              src={img}
              className="h-24 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Status: {d.isActive ? "Active" : "Inactive"}</p>
        <p>Type: {d.type}</p>
        <p>Target: {d.targetRole.toUpperCase()}</p>
        <p>Created: {formatDate(d.createdAt)}</p>
      </div>
    </div>
  );
};
const NewAnnouncementForm = ({
  onDone,
  editItem,
}: {
  onDone: () => void;
  editItem?: any;
}) => {
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("INFO");
  const [pin, setPin] = useState<boolean>(false);
  const [targetRole, setTargetRole] = useState<AnnouncementRole>("all");
  const [enableEndDate, setEnableEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");
  const upload = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [banners, setBanners] = useState<string[]>([]);
  const isEdit = !!editItem;
  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => upload.mutateAsync(f)),
      );
      setBanners((prev) => [...prev, ...urls]);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };
  const removeImage = (i: number) =>
    setBanners((prev) => prev.filter((_, index) => index !== i));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (editItem) {
      try {
        await update.mutateAsync({
          id: editItem._id,
          input: {
            title,
            message,
            type,
            targetRole,
            isPinned: pin,
            banner: banners,
            isActive: true,
            endDate: enableEndDate ? endDate : null,
          },
        });
        toast.success("Announcement updated");
        onDone();
      } catch (e) {
        toast.error(apiErrorMessage(e));
      }
      return;
    }
    try {
      await create.mutateAsync({
        title,
        message,
        type,
        targetRole,
        isPinned: pin,
        banner: banners,
        isActive: true,
        endDate: enableEndDate ? endDate : null,
      });
      toast.success("Announcement published");
      onDone();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };
  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title ?? "");
      setMessage(editItem.message ?? "");
      setType(editItem.type ?? "INFO");
      setTargetRole(editItem.targetRole ?? "all");
      setPin(Boolean(editItem.isPinned));
      setBanners(editItem.banner ?? []);

      if (editItem.endDate) {
        setEnableEndDate(true);
        setEndDate(editItem.endDate);
      } else {
        setEnableEndDate(false);
        setEndDate("");
      }
    } else {
      // ✅ IMPORTANT: RESET WHEN SWITCHING TO "NEW"
      setTitle("");
      setMessage("");
      setType("INFO");
      setTargetRole("all");
      setPin(false);
      setBanners([]);
      setEnableEndDate(false);
      setEndDate("");
    }
  }, [editItem]);
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Content</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as AnnouncementType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                ["INFO", "WARNING", "UPDATE", "PROMOTION"] as AnnouncementType[]
              ).map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Target</Label>
          <Select
            value={targetRole}
            onValueChange={(v) => setTargetRole(v as AnnouncementRole)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["all", "buyer", "farmer", "rider"] as AnnouncementRole[]).map(
                (p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
          <Checkbox
            checked={Boolean(pin)}
            onCheckedChange={(checked) => setPin(Boolean(checked))}
          />

          <span className="block font-medium">Pin</span>
        </label>
        <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
          <Checkbox
            checked={enableEndDate}
            onCheckedChange={(v) => setEnableEndDate(Boolean(v))}
          />
          <span>
            <span className="block font-medium">set End Date</span>
            <span className="text-xs text-muted-foreground">
              Announcement will be archived after this date
            </span>
          </span>
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="expectedHarvestDate">Expected harvest date</Label>
          <Input
            type="date"
            value={endDate}
            disabled={!enableEndDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Images</Label>
          <div className="flex flex-wrap gap-3">
            {(banners ?? []).map((url, i) => (
              <div
                key={url + i}
                className="group relative h-20 w-20 overflow-hidden rounded-xl border"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>
      </div>
      <Button
        type="submit"
        disabled={create.isPending || update.isPending}
        className="w-full"
      >
        Publish
      </Button>
    </form>
  );
};

export default AdminAnnouncements;
