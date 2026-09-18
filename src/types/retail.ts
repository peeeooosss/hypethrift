export type RetailOrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_VERIFIED"
  | "ADDRESS_RELEASED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "BUYER_CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface RetailOrderSummary {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string | null;
  sellerStoreName: string;
  finalPrice: number;
  connectionFee: number;
  total: number;
  status: RetailOrderStatus;
  createdAt: string;
  trackingNumber?: string | null;
}

export interface RetailOrderDetail extends RetailOrderSummary {
  buyerId: string;
  sellerId: string;
  address?: ShippingAddress | null;
  buyerPhone?: string | null;
  paymentMethod?: string | null;
  paymentProofUrl?: string | null;
  adminVerifiedAt?: string | null;
  trackingUrl?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  buyerConfirmedAt?: string | null;
  completedAt?: string | null;
  adminNotes?: string | null;
}

export const RETAIL_ORDER_STATUS_LABEL: Record<RetailOrderStatus, string> = {
  PENDING_PAYMENT: "Payment Pending",
  PAYMENT_VERIFIED: "Payment Verified",
  ADDRESS_RELEASED: "Address Released",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  BUYER_CONFIRMED: "Buyer Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export type StoreThemeId = "MONOCHROME" | "PASTEL" | "NEON";