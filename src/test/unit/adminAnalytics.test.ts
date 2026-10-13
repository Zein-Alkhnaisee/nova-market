import { beforeEach, describe, expect, it } from "vitest";
import {
  ANALYTICS_TOP_PRODUCTS,
  DEFAULT_RANGE,
  ORDER_STATUSES,
  RANGE_OPTIONS,
  computeAnalytics,
  parseRange,
  type CategoryLookup,
  type RangeDays,
} from "../../lib/adminAnalytics";
import { toDayKey } from "../../lib/adminStats";
import { archiveProduct, getProductById, resetStore as resetProducts } from "../../services/catalog/productStore";
import { getCategoryById, resetStore as resetCategories, updateCategory } from "../../services/catalog/categoryStore";
import { products as seed } from "../../mocks/data/products";
import { categories as seedCategories } from "../../mocks/data/categories";
import type { Order, OrderItem, OrderStatus } from "../../types/order";

const NOW = new Date(2026, 9, 3, 12, 0, 0); // 3 Oct 2026, local noon
const daysAgo = (n: number) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - n, 12, 0, 0).toISOString();

// Mirrors the lookup in adminApi.getAnalytics, over the REAL product and category stores.
const categoryOf: CategoryLookup = (productId) => {
  const product = getProductById(productId, { includeArchived: true });
  const category = product ? getCategoryById(product.categoryId) : undefined;
  return category ? { id: category.id, name: category.name } : null;
};

const itemFor = (productId: string, quantity = 1): OrderItem => {
  const p = seed.find((x) => x.id === productId)!;
  return { productId: p.id, slug: p.slug, name: p.name, image: p.image, unitPrice: p.price, quantity, currency: "USD" };
};

function order(id: string, overrides: Partial<Order> = {}): Order {
  return {
    id,
    orderNumber: `NV-${id}`,
    items: [itemFor("p1")],
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
    placedAt: NOW.toISOString(),
    estimatedDelivery: NOW.toISOString(),
    ...overrides,
  };
}
const compute = (orders: Order[], rangeDays: RangeDays = 30) => computeAnalytics({ orders, rangeDays, categoryOf, now: NOW });
const catName = (id: string) => seedCategories.find((c) => c.id === id)!.name;

describe("parseRange", () => {
  it.each(RANGE_OPTIONS)("accepts %s", (n) => expect(parseRange(String(n))).toBe(n));
  it.each([[null], [undefined], [""], ["abc"], ["15"], ["-7"], ["0"], ["7.5"], ["bogus"]])(
    "falls back to the default for %s (a hand-edited URL must not break the page)",
    (raw) => expect(parseRange(raw as string | null)).toBe(DEFAULT_RANGE)
  );
});

describe("computeAnalytics", () => {
  beforeEach(() => {
    resetProducts();
    resetCategories();
  });

  describe("no data", () => {
    it.each(RANGE_OPTIONS)("returns zeros, a full zero-filled %s-day series, all 8 statuses and null averages", (range) => {
      const stats = compute([], range);
      expect(stats).toMatchObject({ revenue: 0, orderCount: 0, itemsSold: 0, averageOrderValue: null, conversion: null });
      expect(stats.revenueByDay).toHaveLength(range);
      expect(stats.revenueByDay.every((d) => d.revenue === 0)).toBe(true);
      expect(stats.ordersByStatus.map((s) => s.status)).toEqual(ORDER_STATUSES);
      expect(stats.ordersByStatus.every((s) => s.count === 0)).toBe(true);
      expect(stats.topProducts).toEqual([]);
      expect(stats.salesByCategory).toEqual([]);
    });

    it("runs from range-1 days ago up to today, in order", () => {
      const days = compute([], 7).revenueByDay.map((d) => d.date);
      expect(days[0]).toBe(toDayKey(new Date(daysAgo(6))));
      expect(days[days.length - 1]).toBe(toDayKey(NOW));
      expect([...days].sort()).toEqual(days);
    });
  });

  describe("the period window", () => {
    const orders = [
      order("today", { placedAt: daysAgo(0) }),
      order("d6", { placedAt: daysAgo(6) }),
      order("d7", { placedAt: daysAgo(7) }),
      order("d29", { placedAt: daysAgo(29) }),
      order("d40", { placedAt: daysAgo(40) }),
      order("d89", { placedAt: daysAgo(89) }),
      order("d100", { placedAt: daysAgo(100) }),
    ];
    it.each([
      [7, ["today", "d6"]],
      [30, ["today", "d6", "d7", "d29"]],
      [90, ["today", "d6", "d7", "d29", "d40", "d89"]],
    ] as const)("a %s-day period includes exactly the orders inside it", (range, ids) => {
      expect(compute(orders, range).orderCount).toBe(ids.length);
    });

    it("excluded orders appear in NO view — not revenue, status counts, products or categories", () => {
      const stats = compute([order("old", { placedAt: daysAgo(40), total: 999 })], 7);
      expect(stats.revenue).toBe(0);
      expect(stats.orderCount).toBe(0);
      expect(stats.ordersByStatus.every((s) => s.count === 0)).toBe(true);
      expect(stats.topProducts).toEqual([]);
      expect(stats.salesByCategory).toEqual([]);
    });

    it("buckets each order's total on its local day", () => {
      const stats = compute([order("a", { total: 40, placedAt: daysAgo(0) }), order("b", { total: 60, placedAt: daysAgo(0) }), order("c", { total: 25, placedAt: daysAgo(3) })], 7);
      const byDay = Object.fromEntries(stats.revenueByDay.map((d) => [d.date, d.revenue]));
      expect(byDay[toDayKey(NOW)]).toBe(100);
      expect(byDay[toDayKey(new Date(daysAgo(3)))]).toBe(25);
      expect(stats.revenue).toBe(125);
    });
  });

  describe("what counts as revenue", () => {
    const mixed = [
      order("ok1", { total: 100, items: [itemFor("p1", 2)] }),
      order("ok2", { total: 300, status: "delivered", items: [itemFor("p2", 1)] }),
      order("cx", { total: 900, status: "cancelled", items: [itemFor("p3", 5)] }),
      order("rf", { total: 700, status: "refunded", items: [itemFor("p3", 4)] }),
    ];

    it("excludes cancelled and refunded orders from revenue, AOV, units, top products and categories", () => {
      const stats = compute(mixed);
      expect(stats.revenue).toBe(400);
      expect(stats.averageOrderValue).toBe(200); // 400 / 2 revenue-counting orders
      expect(stats.itemsSold).toBe(3);
      expect(stats.topProducts.map((p) => p.productId).sort()).toEqual(["p1", "p2"]);
      // Category sales are exactly the line items of the two counted orders — the
      // $900/$700 orders' 9 units of p3 contribute nothing.
      const p1 = seed.find((p) => p.id === "p1")!;
      const p2 = seed.find((p) => p.id === "p2")!;
      const categoryTotal = stats.salesByCategory.reduce((sum, c) => sum + c.revenue, 0);
      expect(categoryTotal).toBeCloseTo(p1.price * 2 + p2.price, 2);
      expect(stats.salesByCategory.reduce((sum, c) => sum + c.units, 0)).toBe(3);
    });

    it("still counts them as orders, and shows them in the status breakdown", () => {
      const stats = compute(mixed);
      expect(stats.orderCount).toBe(4);
      const count = (s: OrderStatus) => stats.ordersByStatus.find((x) => x.status === s)!.count;
      expect(count("confirmed")).toBe(1);
      expect(count("delivered")).toBe(1);
      expect(count("cancelled")).toBe(1);
      expect(count("refunded")).toBe(1);
    });

    it("has a null average (never a division by zero) when nothing counts as revenue", () => {
      const stats = compute([order("cx", { status: "cancelled" })]);
      expect(stats.averageOrderValue).toBeNull();
      expect(stats.revenue).toBe(0);
      expect(stats.orderCount).toBe(1);
    });

    it("measures revenue by order TOTAL but products/categories by LINE-ITEM sales (before discount, shipping, tax)", () => {
      const p1 = seed.find((p) => p.id === "p1")!;
      const stats = compute([order("x", { total: 1000, items: [itemFor("p1", 2)] })]);
      expect(stats.revenue).toBe(1000); // order total
      expect(stats.topProducts[0].revenue).toBe(Math.round(p1.price * 2 * 100) / 100); // line items only
      expect(stats.topProducts[0].revenue).not.toBe(stats.revenue);
    });
  });

  describe("top products", () => {
    it("aggregates across orders, ranks by revenue, and breaks ties alphabetically", () => {
      const a: OrderItem = { productId: "pa", slug: "pa", name: "Alpha", image: "i", unitPrice: 10, quantity: 1, currency: "USD" };
      const b: OrderItem = { productId: "pb", slug: "pb", name: "Beta", image: "i", unitPrice: 10, quantity: 1, currency: "USD" };
      const big: OrderItem = { productId: "pc", slug: "pc", name: "Gamma", image: "i", unitPrice: 100, quantity: 1, currency: "USD" };
      const stats = compute([order("1", { items: [b, a] }), order("2", { items: [big] })]);
      expect(stats.topProducts.map((p) => p.name)).toEqual(["Gamma", "Alpha", "Beta"]); // tie → alphabetical
      const twice = compute([order("1", { items: [a] }), order("2", { items: [a] })]);
      expect(twice.topProducts[0]).toMatchObject({ units: 2, revenue: 20 });
    });

    it(`is capped at ${ANALYTICS_TOP_PRODUCTS}`, () => {
      const items: OrderItem[] = Array.from({ length: 12 }, (_, i) => ({
        productId: `p-${i}`, slug: `p-${i}`, name: `Item ${String(i).padStart(2, "0")}`, image: "i", unitPrice: 10 + i, quantity: 1, currency: "USD",
      }));
      const stats = compute([order("1", { items })]);
      expect(stats.topProducts).toHaveLength(ANALYTICS_TOP_PRODUCTS);
      expect(stats.topProducts[0].name).toBe("Item 11"); // the most expensive line
    });
  });

  describe("sales by category — against the real mock catalog", () => {
    it("attributes line-item sales to each product's category name, summed and sorted by revenue", () => {
      const p2 = seed.find((p) => p.id === "p2")!;
      const p3 = seed.find((p) => p.id === "p3")!;
      const p6 = seed.find((p) => p.id === "p6")!;
      const stats = compute([order("1", { items: [itemFor("p2", 1), itemFor("p3", 1), itemFor("p6", 3)] })]);

      const expected = new Map<string, number>();
      for (const [p, q] of [[p2, 1], [p3, 1], [p6, 3]] as const) expected.set(p.categoryId, (expected.get(p.categoryId) ?? 0) + p.price * q);
      expect(stats.salesByCategory).toHaveLength(expected.size);
      for (const row of stats.salesByCategory) {
        expect(row.name).toBe(catName(row.categoryId!));
        expect(row.revenue).toBeCloseTo(expected.get(row.categoryId!)!, 2);
      }
      const revenues = stats.salesByCategory.map((c) => c.revenue);
      expect([...revenues].sort((x, y) => y - x)).toEqual(revenues);
    });

    it("an unknown product falls into ONE 'unknown' bucket rather than crashing or disappearing", () => {
      const ghost = (id: string): OrderItem => ({ productId: id, slug: id, name: id, image: "i", unitPrice: 20, quantity: 1, currency: "USD" });
      const stats = compute([order("1", { items: [ghost("ghost-1"), ghost("ghost-2"), itemFor("p1")] })]);
      const unknown = stats.salesByCategory.filter((c) => c.categoryId === null);
      expect(unknown).toHaveLength(1);
      expect(unknown[0]).toMatchObject({ name: null, revenue: 40, units: 2 });
    });

    it("an ARCHIVED product is still attributed to its category (orders outlive the storefront listing)", () => {
      const p1 = seed.find((p) => p.id === "p1")!;
      archiveProduct("p1");
      expect(getProductById("p1")).toBeUndefined(); // gone from the storefront...
      const stats = compute([order("1")]);
      expect(stats.salesByCategory[0]).toMatchObject({ categoryId: p1.categoryId, name: catName(p1.categoryId) }); // ...but not from analytics
    });

    it("uses the CURRENT category name after an admin renames it", () => {
      const p1 = seed.find((p) => p.id === "p1")!;
      updateCategory(p1.categoryId, { name: "Gadgets & Gear" });
      expect(compute([order("1")]).salesByCategory[0].name).toBe("Gadgets & Gear");
    });
  });

  it("rounds to cents so floating-point noise never reaches the screen", () => {
    const stats = compute([
      order("1", { total: 0.1, items: [{ productId: "pa", slug: "pa", name: "A", image: "i", unitPrice: 0.1, quantity: 1, currency: "USD" }] }),
      order("2", { total: 0.2, items: [{ productId: "pa", slug: "pa", name: "A", image: "i", unitPrice: 0.2, quantity: 1, currency: "USD" }] }),
    ]);
    expect(stats.revenue).toBe(0.3);
    expect(stats.topProducts[0].revenue).toBe(0.3);
  });

  it("takes the currency from the orders and defaults to USD", () => {
    expect(compute([]).currency).toBe("USD");
    expect(compute([order("1", { currency: "EUR" })]).currency).toBe("EUR");
  });
});
