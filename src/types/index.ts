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
  };
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
