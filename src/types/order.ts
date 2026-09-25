export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface DeliveryOption {
  id: string;
  label: string;
  etaDays: string;
  price: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  currency: string;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  shippingAddress: ShippingAddress;
  deliveryOption: DeliveryOption;
  paymentSummary: { brand: string; last4: string };
  status: OrderStatus;
  timeline: OrderTimelineEntry[];
  placedAt: string;
  estimatedDelivery: string;
}
