import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncementStatus,
} from "@/hooks/useAdminAnnouncements";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AnnouncementPriority, AnnouncementStatus, AnnouncementType } from "@/types/announcement";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AdminAnnouncements = () => {
  const { data: items = [], isLoading } = useAdminAnnouncements();
  const setStatus = useUpdateAnnouncementStatus();
  const del = useDeleteAnnouncement();
  const [open, setOpen] = useState(false);

  const updateStatus = async (id: string, status: AnnouncementStatus) => {
    try {
      await setStatus.mutateAsync({ id, status });
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Broadcast updates to buyers, farmers, riders, and partners."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1"><Plus className="h-4 w-4" /> New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
              <NewAnnouncementForm onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-2xl p-6 text-sm text-muted-foreground">No announcements yet.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a._id} className="rounded-2xl p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="capitalize">{a.type}</Badge>
                    <Badge variant="outline" className="capitalize">{a.priority}</Badge>
                    {a.status && <Badge variant="outline" className="capitalize">{a.status}</Badge>}
                    <span>· {formatDate(a.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={a.status ?? "draft"} onValueChange={(v) => updateStatus(a._id, v as AnnouncementStatus)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["draft", "scheduled", "published", "archived"] as AnnouncementStatus[]).map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => remove(a._id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const NewAnnouncementForm = ({ onDone }: { onDone: () => void }) => {
  const create = useCreateAnnouncement();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<AnnouncementType>("info");
  const [priority, setPriority] = useState<AnnouncementPriority>("medium");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      await create.mutateAsync({ title, content, type, priority, status: "published" });
      toast.success("Announcement published");
      onDone();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as AnnouncementType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["info", "warning", "critical", "promotion", "update"] as AnnouncementType[]).map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as AnnouncementPriority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["low", "medium", "high", "critical"] as AnnouncementPriority[]).map((p) => (
                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={create.isPending} className="w-full">
        Publish
      </Button>
    </form>
  );
};

export default AdminAnnouncements;
