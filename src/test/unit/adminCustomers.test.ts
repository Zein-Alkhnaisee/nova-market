import { describe, expect, it } from "vitest";
import { buildCustomerDetail, buildCustomerSummaries } from "../../lib/adminCustomers";
import type { Order, OrderStatus } from "../../types/order";
import type { User } from "../../types/user";

const ada: User = { id: "u-ada", fullName: "Ada Byron", email: "ada@example.com", role: "customer" };
const bob: User = { id: "u-bob", fullName: "Bob Chen", email: "bob@example.com", role: "customer" };

function order(id: string, overrides: Partial<Order> = {}): Order {
  return {
    id,
    orderNumber: `NV-${id}`,
    items: [],
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 100,
    currency: "USD",
    shippingAddress: { fullName: "X", line1: "", city: "", region: "", postalCode: "", country: "", phone: "" },
    deliveryOption: { id: "s", label: "S", etaDays: "5", price: 0 },
    paymentSummary: { brand: "Visa", last4: "4242" },
    status: "confirmed" as OrderStatus,
    timeline: [],
    placedAt: new Date(2026, 8, 1).toISOString(),
    estimatedDelivery: new Date(2026, 8, 8).toISOString(),
    ...overrides,
  };
}

describe("buildCustomerSummaries", () => {
  it("links orders by customerId and ranks by lifetime spend", () => {
    const { customers } = buildCustomerSummaries(
      [ada, bob],
      [order("1", { customerId: "u-bob", total: 300 }), order("2", { customerId: "u-ada", total: 50 })]
    );
    expect(customers.map((c) => c.id)).toEqual(["u-bob", "u-ada"]);
    expect(customers[0]).toMatchObject({ orderCount: 1, lifetimeSpend: 300 });
  });

  it("counts cancelled/refunded orders as orders but not as spend", () => {
    const { customers } = buildCustomerSummaries(
      [ada],
      [
        order("1", { customerId: "u-ada", total: 100 }),
        order("2", { customerId: "u-ada", total: 900, status: "cancelled" }),
        order("3", { customerId: "u-ada", total: 700, status: "refunded" }),
      ]
    );
    expect(customers[0]).toMatchObject({ orderCount: 3, lifetimeSpend: 100 });
  });

  it("gives customers with no orders a zero row and a null last-order date", () => {
    const { customers } = buildCustomerSummaries([ada], []);
    expect(customers[0]).toMatchObject({ orderCount: 0, lifetimeSpend: 0, lastOrderAt: null });
  });

  it("counts guest orders, legacy orders and orders for unknown accounts as unlinked instead of hiding them", () => {
    const { unlinkedOrderCount } = buildCustomerSummaries(
      [ada],
      [order("1"), order("2", { customerId: "u-deleted" }), order("3", { customerId: "u-ada" })]
    );
    expect(unlinkedOrderCount).toBe(2);
  });

  it("breaks spend ties alphabetically so the order is stable", () => {
    const { customers } = buildCustomerSummaries([bob, ada], []);
    expect(customers.map((c) => c.fullName)).toEqual(["Ada Byron", "Bob Chen"]);
  });
});

describe("buildCustomerDetail", () => {
  it("returns only this customer's orders, newest first, with first/last dates and average", () => {
    const detail = buildCustomerDetail(ada, [
      order("old", { customerId: "u-ada", total: 100, placedAt: new Date(2026, 7, 1).toISOString() }),
      order("new", { customerId: "u-ada", total: 300, placedAt: new Date(2026, 8, 1).toISOString() }),
      order("other", { customerId: "u-bob", total: 999 }),
    ]);
    expect(detail.orders.map((o) => o.id)).toEqual(["new", "old"]);
    expect(detail.lifetimeSpend).toBe(400);
    expect(detail.averageOrderValue).toBe(200);
    expect(detail.firstOrderAt).toBe(new Date(2026, 7, 1).toISOString());
    expect(detail.lastOrderAt).toBe(new Date(2026, 8, 1).toISOString());
  });

  it("degrades to an empty history with a null average when nothing is linked or nothing counts", () => {
    const none = buildCustomerDetail(ada, [order("1")]);
    expect(none.orders).toEqual([]);
    expect(none.averageOrderValue).toBeNull();
    expect(none.lastOrderAt).toBeNull();

    const onlyCancelled = buildCustomerDetail(ada, [order("2", { customerId: "u-ada", status: "cancelled" })]);
    expect(onlyCancelled.orderCount).toBe(1);
    expect(onlyCancelled.averageOrderValue).toBeNull();
  });
});
