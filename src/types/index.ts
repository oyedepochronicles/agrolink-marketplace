// PhyhanAgro shared TypeScript types

export type Role = "buyer" | "farmer" | "rider" | "admin" | "super_admin";
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  verificationStatus?: VerificationStatus;
  avatar?: string;
  state?: string;
  createdAt?: string;
}

export interface Product {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  price: number;
  unit?: string;
  category?: string;
  state?: string;
  images?: string[];
  stock?: number;
  farmer?: Pick<User, "_id" | "name" | "avatar" | "state">;
  createdAt?: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface Order {
  _id: string;
  product: Product;
  buyer: User;
  farmer?: User;
  rider?: User;
  quantity: number;
  totalAmount: number;
  deliveryAddress: string;
  status: OrderStatus;
  paymentReference?: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
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
  attachmentType?: "image" | "audio" | "file";
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  body?: string;
  read: boolean;
  url?: string;
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
