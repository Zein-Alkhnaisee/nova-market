import { isRevenueOrder, toDayKey } from "./adminStats";
import type { Order, OrderStatus } from "../types/order";

/** Selectable reporting periods, in days ending today. */
export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];
export const DEFAULT_RANGE: RangeDays = 30;
export const ANALYTICS_TOP_PRODUCTS = 8;

/** Canonical lifecycle order, so the status breakdown always reads the same way. */
export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
];

/** Only a real option counts: a hand-edited `?range=bogus` falls back to the default. */
export function parseRange(raw: string | null | undefined): RangeDays {
  const n = Number(raw);
  return (RANGE_OPTIONS as readonly number[]).includes(n) ? (n as RangeDays) : DEFAULT_RANGE;
}

/** Resolves a product id to its category; null when the product (or its category) is unknown. */
export type CategoryLookup = (productId: string) => { id: string; name: string } | null;

export interface AnalyticsStats {
  rangeDays: RangeDays;
  currency: string;
  /** Order totals (incl. tax and shipping, after discounts) for orders that count as revenue. */
  revenue: number;
  /** Every order placed in the period, whatever its status. */
  orderCount: number;
  /** Revenue ÷ revenue-counting orders; null when there are none (never divides by zero). */
  averageOrderValue: number | null;
  /** Units sold in revenue-counting orders. */
  itemsSold: number;
  /**
   * Not measurable: needs visit/session data the demo doesn't collect (same as the
   * dashboard). Never fabricated.
   */
  conversion: null;
  /** One entry per day of the period, zero-filled. */
  revenueByDay: { date: string; revenue: number }[];
  /** All eight statuses in lifecycle order, zero-filled; counts EVERY order in the period. */
  ordersByStatus: { status: OrderStatus; count: number }[];
  /** Line-item sales (unit price × quantity — before discounts, shipping and tax). */
  topProducts: { productId: string; name: string; units: number; revenue: number }[];
  /** Same line-item basis, grouped by category; `categoryId: null` = unknown product/category. */
  salesByCategory: { categoryId: string | null; name: string | null; units: number; revenue: number }[];
}

const cents = (n: number) => Math.round(n * 100) / 100;

export function computeAnalytics(input: {
  orders: Order[];
  rangeDays: RangeDays;
  categoryOf: CategoryLookup;
  now?: Date;
}): AnalyticsStats {
  const { orders, rangeDays, categoryOf } = input;
  const now = input.now ?? new Date();

  // The period: `rangeDays` local calendar days ending today, zero-filled.
  const days = new Map<string, number>();
  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    days.set(toDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)), 0);
  }

  const inRange = orders.filter((o) => days.has(toDayKey(new Date(o.placedAt))));
  const counted = inRange.filter(isRevenueOrder);

  let revenue = 0;
  for (const order of counted) {
    revenue += order.total;
    const key = toDayKey(new Date(order.placedAt));
    days.set(key, (days.get(key) ?? 0) + order.total);
  }

  const byProduct = new Map<string, AnalyticsStats["topProducts"][number]>();
  const byCategory = new Map<string, AnalyticsStats["salesByCategory"][number]>();
  let itemsSold = 0;
  for (const order of counted) {
    for (const item of order.items) {
      const line = item.unitPrice * item.quantity;
      itemsSold += item.quantity;

      const p = byProduct.get(item.productId);
      if (p) {
        p.units += item.quantity;
        p.revenue += line;
      } else {
        byProduct.set(item.productId, { productId: item.productId, name: item.name, units: item.quantity, revenue: line });
      }

      const cat = categoryOf(item.productId);
      const key = cat?.id ?? "__unknown__";
      const c = byCategory.get(key);
      if (c) {
        c.units += item.quantity;
        c.revenue += line;
      } else {
        byCategory.set(key, { categoryId: cat?.id ?? null, name: cat?.name ?? null, units: item.quantity, revenue: line });
      }
    }
  }

  const byRevenue = <T extends { revenue: number }>(a: T, b: T) => b.revenue - a.revenue;

  return {
    rangeDays,
    currency: orders[0]?.currency ?? "USD",
    revenue: cents(revenue),
    orderCount: inRange.length,
    averageOrderValue: counted.length > 0 ? cents(revenue / counted.length) : null,
    itemsSold,
    conversion: null,
    revenueByDay: [...days].map(([date, value]) => ({ date, revenue: cents(value) })),
    ordersByStatus: ORDER_STATUSES.map((status) => ({ status, count: inRange.filter((o) => o.status === status).length })),
    topProducts: [...byProduct.values()]
      .map((p) => ({ ...p, revenue: cents(p.revenue) }))
      .sort((a, b) => byRevenue(a, b) || a.name.localeCompare(b.name))
      .slice(0, ANALYTICS_TOP_PRODUCTS),
    salesByCategory: [...byCategory.values()]
      .map((c) => ({ ...c, revenue: cents(c.revenue) }))
      .sort((a, b) => byRevenue(a, b) || (a.name ?? "~").localeCompare(b.name ?? "~")),
  };
}
