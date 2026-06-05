import type { Role } from "./index";

export type AnnouncementType = "info" | "warning" | "critical" | "promotion" | "update";
export type AnnouncementPriority = "low" | "medium" | "high" | "critical";
export type AnnouncementStatus = "draft" | "scheduled" | "published" | "archived";

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  targetRoles?: Role[];
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  dismissible?: boolean;
  pinned?: boolean;
  isDismissed?: boolean;
  status?: AnnouncementStatus;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
}
