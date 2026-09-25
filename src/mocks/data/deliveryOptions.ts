import type { DeliveryOption } from "../../types/order";

export const deliveryOptions: DeliveryOption[] = [
  { id: "standard", label: "Standard", etaDays: "5–7 business days", price: 6 },
  { id: "express", label: "Express", etaDays: "2–3 business days", price: 16 },
  { id: "next-day", label: "Next day", etaDays: "1 business day", price: 32 },
];

export const FREE_SHIPPING_THRESHOLD = 150;
