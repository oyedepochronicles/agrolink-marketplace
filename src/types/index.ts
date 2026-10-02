// PhyhanAgro shared TypeScript types

export type Role =
  | "buyer"
  | "farmer"
  | "rider"
  | "admin"
  | "super_admin"
  // Farm Agent: acts on behalf of ASSIGNED farmers only. Its own portal (/agent),
  // NOT staff and NOT an admin — holds an explicit, minimal permission slice
  // (agents:read, agents:act). The backend is the source of truth via `permissions`.
  | "farm_agent"
  // Operational staff roles (admin-created, never self-registered). Each holds a
  // narrow permission slice; the backend is the source of truth via `permissions`.
  | "support"
  | "technical_support"
  | "operations_manager"
  | "pickup_agent"
  | "pickup_station_manager"
  | "warehouse_agent"
  | "warehouse_manager"
  | "logistics_manager"
  | "financial_manager"
  | "risk_compliance"
  | "quality_control"
  | "engineering";
export type VerificationStatus =
  | "pending"
  | "pending_verification"
  | "approved"
  | "rejected"
  | "not_verify";

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  /**
   * Effective capability tokens for this user's role, as resolved by the
   * backend (defaults ⊕ super_admin override). May contain the "*" wildcard for
   * super_admin. UX/defense-in-depth only — the backend re-checks every request.
   */
  permissions?: string[];
  verificationStatus?: VerificationStatus;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  phoneVerified?: boolean;
  emailVerifiedAt?: string;
  mfaEnabled?: boolean;
  mfaEnrolledAt?: string;
  lastLoginAt?: string;
  inviteStatus?: "pending" | "accepted" | "expired";
  adminInviteAcceptedAt?: string;
  isSuspended?: boolean;
  isDeactivated?: boolean;
  isDeleted?: boolean;
  accountState?: "active" | "suspended" | "deactivated" | "deleted" | "invited";
  profileImage?: string;
  avatar?: string;
  /**
   * Cross-device UI preferences (client-presentation only), persisted via
   * `PATCH /users/me/preferences` and surfaced on `/auth/me`. Absent when the
   * user has never explicitly chosen one — the client then falls back to its
   * saved-local → browser → default chain. Never affects money or API codes.
   */
  preferences?: {
    language?: "en" | "yo" | "ha" | "ig";
    theme?: "light" | "dark" | "system";
  };
  state?: string;
  avgRating?: number;
  ratingsCount?: number;
  createdAt?: string;
  location?: {
    state?: string;
    lga?: string;
    fullAddress?: string;
    landmark?: string;
    geo?: GeoPoint;
  };
  currentLocation?: GeoPoint;
  currentLocationUpdatedAt?: string;
  isOnline?: boolean;
  isAvailable?: boolean;
  farmerProfile?: {
    farmName?: string;
    farmAddress?: string;
    farmState?: string;
    farmLga?: string;
    farmLandmark?: string;
    farmPhone?: string;
    idType?: string;
    idNumber?: string;
    idDocumentUrl?: string;
    farmPhotoUrl?: string;
  };
  riderProfile?: {
    vehicleType?: string;
    vehicleNumber?: string;
    licenseNumber?: string;
    idType?: string;
    idDocumentUrl?: string;
    driverLicenseUrl?: string;
  };
  buyerProfile?: {
    idType?: string;
    idDocumentUrl?: string;
  };
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  verificationRejectionReason?: string;
  diditSessionId?: string;
  diditWorkflowUrl?: string;
  diditStatus?: "pending" | "approved" | "declined" | "failed" | "expired";
  diditLastEventId?: string;
  diditVerifiedAt?: string;
  requestedRole?: Extract<Role, "farmer" | "rider">;
  requestedRoleProfile?: Record<string, unknown>;
  requestedRoleSubmittedAt?: string;
}

export interface GeoPoint {
  type?: "Point";
  coordinates?: [number, number] | number[];
}

export interface OrderLocation {
  address?: string;
  coordinates?: GeoPoint;
}

export interface Review {
  _id: string;
  product: string;
  rating: number;
  body?: string;
  buyerId: Pick<User, "_id" | "name" | "profileImage">;
  user?: Pick<User, "_id" | "name">;
  reply?: { body: string; createdAt: string };
  createdAt: string;
}

export interface ProductRatingSummary {
  average: number;
  count: number;
}

export type SupportTicketStatus = "open" | "pending" | "escalated" | "waiting_customer" | "resolved" | "closed";
export type SupportTicketDepartment = "support" | "finance" | "operations" | "pickup" | "warehouse" | "logistics" | "technical" | "risk_compliance" | "quality" | "admin" | "engineering";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export interface SupportTicketReply {
  _id: string;
  body: string;
  author?: Pick<User, "_id" | "name" | "avatar" | "role">;
  createdAt: string;
}

export interface SupportTicket {
  _id: string;
  subject: string;
  body: string;
  category?: string;
  status: SupportTicketStatus;
  department?: SupportTicketDepartment;
  priority?: SupportTicketPriority;
  assignedTo?: Pick<User, "_id" | "name" | "email" | "role">;
  orderId?: string;
  parentOrderId?: string;
  slaDueAt?: string;
  resolvedAt?: string;
  user?: Pick<User, "_id" | "name" | "profileImage" | "email">;
  replies?: SupportTicketReply[];
  events?: Array<{ _id: string; type: string; message?: string; from?: string; to?: string; actor?: Pick<User, "_id" | "name" | "role">; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface Product {
  _id: string;
  id?: string;
  title?: string;
  name: string;
  description?: string;
  price: number;
  discount?: {
    type?: "fixed" | "percentage" | "none";
    value?: number;
    startsAt?: string;
    endsAt?: string;
  };
  unit?: string;
  quantity?: number;
  category?: string;
  state?: string;
  images?: string[];
  stock?: number;
  harvestDate?: string;
  expectedHarvestDate?: string;
  isPreHarvest?: boolean;
  farmerId?: string;
  farmer?: Pick<
    User,
    "_id" | "name" | "profileImage" | "state" | "avgRating" | "ratingsCount"
  >;
  rating?: number;
  reviewsCount?: number;
  status?: "available" | "reserved" | "sold" | "expired";
  adminStatus?: "active" | "inactive";
  // Farm-Agent on-behalf provenance. Set by the backend when a farm_agent creates
  // or manages a listing for an assigned farmer; ownership (farmerId) stays with the
  // farmer. Presence of createdByAgent means "agent-managed" — the UI badges it so a
  // farmer-performed listing is always distinguishable from an agent-on-behalf one.
  createdByAgent?: string;
  onBehalfOfFarmer?: string;
  isLimitedVisibility?: boolean;
  location?: {
    state?: string;
    lga?: string;
    fullAddress?: string;
    city?: string;
    landmark?: string;
    geo?: GeoPoint;
  };
  createdAt?: string;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "ready_for_pickup"
  | "rejected"
  | "completed"
  | "paid"
  | "processing"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "pickup";

export interface Order {
  _id: string;
  product?: Product;
  productId?: Product;
  buyer?: User;
  buyerId?: User;
  farmer?: User;
  farmerId?: User;
  rider?: User;
  riderId?: User;
  quantity: number;
  amount?: number;
  deliveryFee?: number;
  serviceFee?: number;
  tax?: number;
  discount?: number;
  walletDeduction?: number;
  grandTotal?: number;
  originalAmount?: number;
  refundAmount?: number;
  refundReason?: string;
  refundReference?: string;
  refundStatus?: "none" | "refunded";
  refundedAt?: string;
  trackingEvents?: {
    status: string;
    message: string;
    actorRole?: string;
    createdAt?: string;
  }[];
  total?: number;
  totalAmount?: number;
  deliveryMethod?: "delivery" | "pickup";
  deliveryUrgency?: "standard" | "urgent";
  deliveryStatus?: DeliveryStatus;
  deliveryAddress?:
    | string
    | {
        recipient?: string;
        phone?: string;
        secondPhone?: string;
        street?: string;
        city?: string;
        state?: string;
        lga?: string;
        fullAddress?: string;
        notes?: string;
        geo?: GeoPoint;
      };
  pickupAddress?: {
    farmName?: string;
    contactName?: string;
    contactPhone?: string;
    secondPhone?: string;
    state?: string;
    lga?: string;
    fullAddress?: string;
    landmark?: string;
    geo?: GeoPoint;
  };
  pickupLocation?: OrderLocation;
  deliveryLocation?: OrderLocation;
  matching?: {
    score: number;
    source?: "mapbox" | "haversine";
    pickupDistanceKm: number;
    deliveryDistanceKm: number;
    pickupDurationMin?: number;
    deliveryDurationMin?: number;
    totalDistanceKm?: number;
    totalDurationMin?: number;
    waitingMinutes: number;
  };
  status: OrderStatus;
  paymentStatus?: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: "in_app" | "offline" | "pay_later";
  paymentReference?: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  product?: Pick<Product, "_id" | "title" | "price" | "unit" | "images">;
  lastMessage?: Message;
  lastMessageAt?: string;
  lastMessageText?: string;
  unreadCount?: number;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string;
  body?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: "image" | "audio" | "file";
  status?: "sent" | "delivered" | "read";
  deliveredAt?: string;
  readAt?: string;
  product?: Pick<Product, "_id" | "title" | "price" | "unit" | "images">;
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  body?: string;
  message?: string;
  read: boolean;
  isRead?: boolean;
  url?: string;
  link?: string;
  type?: "order" | "chat" | "admin" | "system";
  meta?: Record<string, unknown>;
  createdAt: string;
}

export type WalletTxType = "credit" | "debit" | "payout" | "refund";
export type PayoutStatus = "pending" | "processing" | "paid" | "rejected";

export interface WalletTransaction {
  _id: string;
  type: WalletTxType;
  amount: number;
  description?: string;
  reference?: string;
  status?: string;
  createdAt: string;
}

export interface WalletSummary {
  balance: number;
  pending: number;
  lifetimeEarnings: number;
  lifetimePayouts: number;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface PayoutRequest {
  _id: string;
  user?: Pick<User, "_id" | "name" | "email" | "role">;
  amount: number;
  status: PayoutStatus;
  bankAccount?: BankAccount;
  note?: string;
  createdAt: string;
  processedAt?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
