import { describe, expect, it } from "vitest";
import { computePricing } from "../../lib/pricing";
import type { CartLine } from "../../types/cart";
import type { DeliveryOption } from "../../types/order";

const line = (overrides: Partial<CartLine> = {}): CartLine => ({
  productId: "p1",
  slug: "test",
  name: "Test product",
  image: "img.jpg",
  price: 50,
  currency: "USD",
  quantity: 1,
  ...overrides,
});

const standardDelivery: DeliveryOption = { id: "standard", label: "Standard", etaDays: "5-7 days", price: 6 };

describe("computePricing", () => {
  it("computes subtotal as price × quantity summed across lines", () => {
    const pricing = computePricing([line({ price: 50, quantity: 2 }), line({ price: 20, quantity: 1 })]);
    expect(pricing.subtotal).toBe(120);
  });

  it("applies shipping cost from the delivery option below the free-shipping threshold", () => {
    const pricing = computePricing([line({ price: 50 })], { deliveryOption: standardDelivery });
    expect(pricing.shipping).toBe(6);
    expect(pricing.qualifiesForFreeShipping).toBe(false);
  });

  it("waives shipping at or above the free-shipping threshold", () => {
    const pricing = computePricing([line({ price: 200 })], { deliveryOption: standardDelivery });
    expect(pricing.shipping).toBe(0);
    expect(pricing.qualifiesForFreeShipping).toBe(true);
  });

  it("applies a percentage discount before computing tax", () => {
    const pricing = computePricing([line({ price: 100 })], { discountPercent: 10 });
    expect(pricing.discount).toBe(10);
    // tax should be computed on the discounted amount (90), not the raw subtotal (100)
    expect(pricing.tax).toBeCloseTo(90 * 0.08, 2);
  });

  it("computes total as subtotal - discount + shipping + tax", () => {
    const pricing = computePricing([line({ price: 100 })], {
      deliveryOption: standardDelivery,
      discountPercent: 10,
    });
    const expectedTotal = 100 - pricing.discount + pricing.shipping + pricing.tax;
    expect(pricing.total).toBeCloseTo(expectedTotal, 2);
  });

  it("reports the amount remaining until free shipping", () => {
    const pricing = computePricing([line({ price: 100 })]);
    expect(pricing.amountUntilFreeShipping).toBe(50);
  });

  it("never returns a negative total", () => {
    const pricing = computePricing([line({ price: 10 })], { discountPercent: 100 });
    expect(pricing.total).toBeGreaterThanOrEqual(0);
  });
});
