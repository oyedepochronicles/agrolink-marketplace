export type AnnouncementType = "INFO" | "WARNING" | "UPDATE" | "PROMOTION";
export type AnnouncementPriority = "low" | "medium" | "high" | "critical";
export type AnnouncementStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived";
export type AnnouncementRole = "all" | "buyer" | "farmer" | "rider";

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  targetRole?: AnnouncementRole;
  imageUrl?: string;
  isActive?: boolean;
  endDate?: string;
  banner?: string[];
  actionUrl?: string;
  actionLabel?: string;
  dismissible?: boolean;
  isPinned?: boolean;
  isDismissed?: boolean;
  status?: AnnouncementStatus;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
}
