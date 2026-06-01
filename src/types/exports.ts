import type { User } from "./index";

export interface ExportDocument {
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
}

export type ExportRequestStatus = "open" | "reviewing" | "closed" | "fulfilled";
export type ExportModerationStatus = "pending" | "approved" | "rejected";
export type ExportApplicationStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "withdrawn";
export type ExportShipmentStatus =
  | "awaiting_pickup"
  | "processing"
  | "in_transit"
  | "shipped"
  | "delivered";

export interface ExportPriceRange {
  min?: number;
  max?: number;
  currency?: string;
}

export interface ExportRequest {
  _id: string;
  partnerId?: Pick<User, "_id" | "name" | "email" | "profileImage"> & {
    companyName?: string;
    companyLogo?: string;
  };
  productName: string;
  quantityRequired: number;
  unit?: string;
  qualityRequirements: string;
  packagingRequirements: string;
  destinationCountry: string;
  priceRange?: ExportPriceRange;
  applicationDeadline: string;
  pickupLocation: string;
  additionalNotes?: string;
  documents?: ExportDocument[];
  status: ExportRequestStatus;
  moderationStatus: ExportModerationStatus;
  applicationsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ExportApplication {
  _id: string;
  requestId: string | ExportRequest;
  farmerId?: Pick<User, "_id" | "name" | "email" | "profileImage" | "phone">;
  partnerId?: string;
  quantityAvailable: number;
  proposedPrice: number;
  currency?: string;
  harvestDetails: string;
  qualityNotes?: string;
  packagingReadiness?: string;
  productImages?: ExportDocument[];
  documents?: ExportDocument[];
  status: ExportApplicationStatus;
  reviewNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExportShipmentEvent {
  status: ExportShipmentStatus;
  note?: string;
  location?: string;
  actorId?: string;
  at: string;
}

export interface ExportShipment {
  _id: string;
  applicationId?: string | ExportApplication;
  requestId?: string | ExportRequest;
  partnerId?: Pick<User, "_id" | "name">;
  farmerId?: Pick<User, "_id" | "name">;
  status: ExportShipmentStatus;
  pickupDate?: string;
  pickupLocation?: string;
  carrier?: string;
  trackingReference?: string;
  documents?: ExportDocument[];
  events?: ExportShipmentEvent[];
  createdAt: string;
  updatedAt?: string;
}

export interface ExportPartnerOverview {
  cards: {
    totalRequests: number;
    openRequests: number;
    applications: number;
    acceptedApplications: number;
    activeShipments: number;
  };
  requests: ExportRequest[];
  applications: ExportApplication[];
  shipments: ExportShipment[];
}

export interface ExportAdminOverview {
  cards: {
    pendingPartners: number;
    totalPartners: number;
    openRequests: number;
    applications: number;
    activeShipments: number;
  };
  recentRequests: ExportRequest[];
}
