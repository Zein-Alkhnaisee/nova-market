import { FREE_SHIPPING_THRESHOLD } from "../mocks/data/deliveryOptions";
import type { CartLine } from "../types/cart";
import type { DeliveryOption } from "../types/order";

const TAX_RATE = 0.08;

export interface PricingBreakdown {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  amountUntilFreeShipping: number;
  qualifiesForFreeShipping: boolean;
}

export function computePricing(
  lines: CartLine[],
  options: { deliveryOption?: DeliveryOption; discountPercent?: number } = {}
): PricingBreakdown {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const discount = Math.round(subtotal * ((options.discountPercent ?? 0) / 100) * 100) / 100;
  const shippingPrice = options.deliveryOption?.price ?? 0;
  const shipping = qualifiesForFreeShipping ? 0 : shippingPrice;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const total = Math.max(0, taxableAmount + shipping + tax);
  const amountUntilFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return { subtotal, discount, shipping, tax, total, amountUntilFreeShipping, qualifiesForFreeShipping };
}
