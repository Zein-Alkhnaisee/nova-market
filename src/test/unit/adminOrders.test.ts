import { describe, expect, it } from "vitest";
import { buildOrderDetail, buildOrderRows } from "../../lib/adminOrders";
import type { Order, OrderStatus } from "../../types/order";
import type { User } from "../../types/user";

const ada: User = { id: "u-ada", fullName: "Ada Byron", email: "ada@example.com", role: "customer" };

function order(id: string, overrides: Partial<Order> = {}): Order {
  return {
    id,
    orderNumber: `NV-${id}`,
    items: [{ productId: "p", slug: "p", name: "W", image: "i.jpg", unitPrice: 10, quantity: 2, currency: "USD" }],
    subtotal: 20, discount: 0, shipping: 0, tax: 0, total: 20, currency: "USD",
    shippingAddress: { fullName: "Recipient Name", line1: "", city: "", region: "", postalCode: "", country: "", phone: "" },
    deliveryOption: { id: "s", label: "S", etaDays: "5", price: 0 },
    paymentSummary: { brand: "Visa", last4: "4242" },
    status: "confirmed" as OrderStatus,
    timeline: [],
    placedAt: new Date(2026, 8, 1).toISOString(),
    estimatedDelivery: new Date(2026, 8, 8).toISOString(),
    ...overrides,
  };
}

describe("buildOrderRows", () => {
  it("sorts newest first and sums item quantities", () => {
    const rows = buildOrderRows(
      [order("old", { placedAt: new Date(2026, 7, 1).toISOString() }), order("new", { placedAt: new Date(2026, 8, 20).toISOString() })],
      []
    );
    expect(rows.map((r) => r.id)).toEqual(["new", "old"]);
    expect(rows[0].itemCount).toBe(2);
  });

  it("uses the linked account's name, and the shipping recipient for guest and legacy orders", () => {
    const rows = buildOrderRows([order("a", { customerId: "u-ada" }), order("b")], [ada]);
    expect(rows.find((r) => r.id === "a")).toMatchObject({ customerName: "Ada Byron", customerId: "u-ada" });
    expect(rows.find((r) => r.id === "b")).toMatchObject({ customerName: "Recipient Name", customerId: null });
  });

  it("treats a customerId that matches no account as a guest order instead of failing", () => {
    const [row] = buildOrderRows([order("a", { customerId: "u-deleted" })], [ada]);
    expect(row).toMatchObject({ customerName: "Recipient Name", customerId: null });
  });
});

describe("buildOrderDetail", () => {
  it("returns the linked customer and the statuses the order may move to", () => {
    const d = buildOrderDetail(order("a", { customerId: "u-ada", status: "processing" }), [ada]);
    expect(d.customer).toEqual({ id: "u-ada", fullName: "Ada Byron", email: "ada@example.com" });
    expect(d.allowedNext).toEqual(["shipped", "cancelled"]);
  });

  it("returns a null customer for a guest order and no next statuses for a final one", () => {
    const d = buildOrderDetail(order("b", { status: "refunded" }), [ada]);
    expect(d.customer).toBeNull();
    expect(d.allowedNext).toEqual([]);
  });
});
