// Farm Exchange (Phase 6) shared client types.
//
// Mirrors the server serializers in services/ExchangeService.js (serializeListing
// / serializeOrder). The exchange is the farmer<->farmer by-product marketplace —
// a HARD-partitioned surface separate from the consumer marketplace. Nothing here
// moves platform money: an order records intent + an immutable listing snapshot,
// and settlement (free give-away or paid) is arranged offline between the two
// farmers. A counterparty's contact details appear ONLY once the seller accepts.
//
// NO AUTO-CLASSIFICATION: by-product fields are farmer-declared free text. The
// platform never asserts a by-product is safe, edible, or fit for any purpose.

export type ExchangePricingType = "free" | "paid";
export type ExchangeListingStatus = "available" | "reserved" | "sold" | "expired";
export type ExchangeAdminStatus = "active" | "inactive";
export type ExchangeDeliveryOption = "pickup" | "delivery" | "both";
export type ExchangeOrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

// Farmer-declared by-product metadata. All fields optional; notForHumanConsumption
// defaults to false server-side (undeclared, NOT a "safe for humans" claim).
export interface ExchangeByproduct {
  suggestedUse?: string;
  safetyNote?: string;
  notForHumanConsumption?: boolean;
}

// The public identity of a listing's owner — area + rating only, NEVER contact.
export interface ExchangeListingFarmer {
  _id: string;
  name?: string;
  state?: string;
  lga?: string;
  avgRating?: number;
  ratingsCount?: number;
  verificationStatus?: string;
}

export interface ExchangeListing {
  _id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  pricingType: ExchangePricingType;
  quantity: number;
  unit: string;
  deliveryOption?: ExchangeDeliveryOption;
  status: ExchangeListingStatus;
  adminStatus?: ExchangeAdminStatus;
  images: string[];
  location?: { state?: string; lga?: string };
  byproduct?: ExchangeByproduct;
  farmer?: ExchangeListingFarmer;
  farmerId: string;
  isMine?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Immutable copy of the listing terms captured on the order at creation time.
export interface ExchangeListingSnapshot {
  name: string;
  category: string;
  unit: string;
  pricingType: ExchangePricingType;
  unitPrice: number;
  byproduct?: ExchangeByproduct;
}

// A party on an order (seller/buyer) — minimal public identity.
export interface ExchangeParty {
  _id: string;
  name?: string;
  state?: string;
}

// The counterparty's contact — present ONLY on accepted orders (contactShared).
export interface ExchangeContact {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  state?: string;
  lga?: string;
}

export interface ExchangeOrder {
  _id: string;
  productId: string;
  seller: ExchangeParty;
  buyer: ExchangeParty;
  listingSnapshot: ExchangeListingSnapshot;
  quantity: number;
  pricingType: ExchangePricingType;
  unitPrice: number;
  totalAmount: number;
  status: ExchangeOrderStatus;
  buyerNote?: string;
  decisionNote?: string;
  contactShared: boolean;
  // Only set once the seller accepts. `role` tells the viewer which side they are.
  contact?: ExchangeContact;
  role?: "seller" | "buyer";
  acceptedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExchangePageMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Categories mirror the server PRODUCT_CATEGORIES enum (models/Product.js). The
// exchange is by-product oriented, so the circular-economy streams are surfaced
// first, but the full enum is offered so client + server validation stay in sync.
export const EXCHANGE_CATEGORIES = [
  "Feed",
  "Manure",
  "Compost",
  "Seedling",
  "Vegetable",
  "Fruit",
  "Grain",
  "Tuber",
  "Legume",
  "Spice",
  "Livestock",
  "Poultry",
  "Fish",
  "Dairy",
  "Egg",
  "Other",
] as const;

export const EXCHANGE_UNITS = [
  "kg",
  "g",
  "tonne",
  "bag",
  "sack",
  "bunch",
  "crate",
  "litre",
  "piece",
  "load",
] as const;
