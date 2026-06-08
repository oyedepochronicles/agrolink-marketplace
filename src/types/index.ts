// PhyhanAgro shared TypeScript types

export type Role = "buyer" | "farmer" | "rider" | "admin" | "super_admin";
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
  verificationStatus?: VerificationStatus;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  phoneVerified?: boolean;
  emailVerifiedAt?: string;
  isSuspended?: boolean;
  isDeactivated?: boolean;
  accountState?: "active" | "suspended" | "deactivated";
  profileImage?: string;
  avatar?: string;
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

export type SupportTicketStatus = "open" | "pending" | "resolved" | "closed";

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
  user?: Pick<User, "_id" | "name" | "profileImage" | "email">;
  replies?: SupportTicketReply[];
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
  paymentStatus?: "unpaid" | "paid";
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
