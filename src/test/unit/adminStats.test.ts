import { describe, expect, it } from "vitest";
import { computeDashboardStats, REVENUE_DAYS, toDayKey } from "../../lib/adminStats";
import type { Order, OrderStatus } from "../../types/order";
import type { ProductSummary } from "../../types/product";

const NOW = new Date(2026, 8, 30, 12, 0, 0); // 30 Sep 2026, local noon

function order(overrides: Partial<Order> & { id: string }): Order {
  return {
    orderNumber: `NV-${overrides.id}`,
    items: [{ productId: "p1", slug: "p1", name: "Widget", image: "i.jpg", unitPrice: 50, quantity: 1, currency: "USD" }],
    subtotal: 50,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 100,
    currency: "USD",
    shippingAddress: { fullName: "Jordan Lee", line1: "", city: "", region: "", postalCode: "", country: "", phone: "" },
    deliveryOption: { id: "s", label: "S", etaDays: "5", price: 0 },
    paymentSummary: { brand: "Visa", last4: "4242" },
    status: "confirmed" as OrderStatus,
    timeline: [],
    placedAt: NOW.toISOString(),
    estimatedDelivery: NOW.toISOString(),
    ...overrides,
  };
}

const product = (id: string, inStock: boolean) => ({ id, inStock }) as ProductSummary;

describe("computeDashboardStats", () => {
  it("returns zeros, a full zero-filled revenue window and null conversion with no data", () => {
    const stats = computeDashboardStats({ orders: [], customerCount: 0, products: [], now: NOW });
    expect(stats.revenue).toBe(0);
    expect(stats.orderCount).toBe(0);
    expect(stats.topProducts).toEqual([]);
    expect(stats.recentOrders).toEqual([]);
    expect(stats.revenueByDay).toHaveLength(REVENUE_DAYS);
    expect(stats.revenueByDay.every((d) => d.revenue === 0)).toBe(true);
    expect(stats.conversion).toBeNull();
  });

  it("excludes cancelled and refunded orders from revenue and top products but still counts them as orders", () => {
    const stats = computeDashboardStats({
      orders: [
        order({ id: "a", total: 100 }),
        order({ id: "b", total: 500, status: "cancelled" }),
        order({ id: "c", total: 300, status: "refunded" }),
      ],
      customerCount: 3,
      products: [],
      now: NOW,
    });
    expect(stats.revenue).toBe(100);
    expect(stats.orderCount).toBe(3);
    expect(stats.topProducts[0].units).toBe(1);
  });

  it("counts only pending/confirmed/processing orders as needing attention", () => {
    const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    const stats = computeDashboardStats({
      orders: statuses.map((status, i) => order({ id: String(i), status })),
      customerCount: 0,
      products: [],
      now: NOW,
    });
    expect(stats.openOrderCount).toBe(3);
  });

  it("buckets revenue by local day, ignoring orders older than the window", () => {
    const yesterday = new Date(2026, 8, 29, 9, 0, 0);
    const old = new Date(2026, 7, 1, 9, 0, 0);
    const stats = computeDashboardStats({
      orders: [
        order({ id: "t", total: 100, placedAt: NOW.toISOString() }),
        order({ id: "y", total: 40, placedAt: yesterday.toISOString() }),
        order({ id: "o", total: 999, placedAt: old.toISOString() }),
      ],
      customerCount: 0,
      products: [],
      now: NOW,
    });
    const byKey = Object.fromEntries(stats.revenueByDay.map((d) => [d.date, d.revenue]));
    expect(byKey[toDayKey(NOW)]).toBe(100);
    expect(byKey[toDayKey(yesterday)]).toBe(40);
    expect(stats.revenueByDay.some((d) => d.date === toDayKey(old))).toBe(false);
    expect(stats.revenue).toBe(1139); // total revenue still includes older orders
    expect(stats.revenueByDay[stats.revenueByDay.length - 1].date).toBe(toDayKey(NOW));
  });

  it("aggregates top products across orders, ranked by revenue and capped at 5", () => {
    const item = (productId: string, unitPrice: number, quantity: number) => ({
      productId, slug: productId, name: productId.toUpperCase(), image: "i.jpg", unitPrice, quantity, currency: "USD",
    });
    const stats = computeDashboardStats({
      orders: [
        order({ id: "1", items: [item("a", 10, 1), item("b", 100, 1), item("c", 1, 1)] }),
        order({ id: "2", items: [item("a", 10, 4), item("d", 2, 1), item("e", 3, 1), item("f", 4, 1)] }),
      ],
      customerCount: 0,
      products: [],
      now: NOW,
    });
    expect(stats.topProducts).toHaveLength(5);
    expect(stats.topProducts[0]).toMatchObject({ productId: "b", revenue: 100 });
    expect(stats.topProducts[1]).toMatchObject({ productId: "a", units: 5, revenue: 50 });
  });

  it("returns the 5 most recent orders newest first, with the recipient name", () => {
    const orders = Array.from({ length: 7 }, (_, i) =>
      order({ id: String(i), placedAt: new Date(2026, 8, 20 + i).toISOString() })
    );
    const stats = computeDashboardStats({ orders, customerCount: 0, products: [], now: NOW });
    expect(stats.recentOrders).toHaveLength(5);
    expect(stats.recentOrders[0].id).toBe("6");
    expect(stats.recentOrders[0].customerName).toBe("Jordan Lee");
  });

  it("counts products and out-of-stock products", () => {
    const stats = computeDashboardStats({
      orders: [],
      customerCount: 4,
      products: [product("a", true), product("b", false), product("c", false)],
      now: NOW,
    });
    expect(stats.productCount).toBe(3);
    expect(stats.outOfStockCount).toBe(2);
    expect(stats.customerCount).toBe(4);
  });
});
