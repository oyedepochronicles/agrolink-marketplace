// Batch-based fulfillment types.
import type { Order, User, GeoPoint } from "./index";

export type BatchStatus =
  | "open"
  | "ready"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "waiting_harvest"
  | "picked_up";

export type BatchType = "scheduled" | "consolidated" | "farmer_group" | "immediate";

export type SLAState =
  | "READY_NOW"
  | "EXPRESS_READY"
  | "DELAYED_HARVEST"
  | "OVERDUE";

export interface BatchSchedule {
  date?: string;
  startTime?: string;
  endTime?: string;
}

export interface FarmerGroup {
  farmerId: string;
  farmerName?: string;
  farmer?: Pick<User, "_id" | "name" | "profileImage" | "state">;
  pickupAddress?: {
    fullAddress?: string;
    state?: string;
    lga?: string;
    geo?: GeoPoint;
  };
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    price: number;
    unit?: string;
    image?: string;
  }>;
}

export interface Batch {
  _id: string;
  name?: string;
  status: BatchStatus;
  type: BatchType;
  slaDeadline?: string;
  slaState?: SLAState;
  pickupSchedule?: BatchSchedule;
  deliverySchedule?: BatchSchedule;
  rider?: Pick<User, "_id" | "name" | "phone" | "profileImage">;
  riderId?: string;
  farmerGroups?: FarmerGroup[];
  childOrders?: Order[];
  routeStops?: Array<{
    label?: string;
    address?: string;
    geo?: GeoPoint;
    sequence?: number;
  }>;
  destination?: {
    address?: string;
    geo?: GeoPoint;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface ParentOrderSummary {
  subtotal: number;
  deliveryFee: number;
  consolidatedDeliveryFee?: number;
  serviceFee?: number;
  tax?: number;
  grandTotal: number;
}

export interface ParentOrder {
  _id: string;
  buyerId?: string;
  buyer?: Pick<User, "_id" | "name" | "email" | "profileImage">;
  status: "draft" | "ready" | "in_progress" | "delivered" | "cancelled" | "paid";
  batches: Batch[];
  childOrderIds?: string[];
  summary: ParentOrderSummary;
  paymentReference?: string;
  paymentStatus?: "unpaid" | "paid";
  createdAt: string;
  updatedAt?: string;
}

export interface GroupedCart {
  farmerId: string;
  farmerName?: string;
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    price: number;
    unit?: string;
    image?: string;
  }>;
  subtotal: number;
}
