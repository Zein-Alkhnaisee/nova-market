import type { Order, OrderStatus } from "../types/order";
import type { ProductSummary } from "../types/product";

/** Orders in these statuses don't count as revenue. */
const NON_REVENUE: OrderStatus[] = ["cancelled", "refunded"];
/** Orders still waiting on the store to act. */
const OPEN: OrderStatus[] = ["pending", "confirmed", "processing"];

/** True when an order counts toward revenue / lifetime spend. */
export function isRevenueOrder(order: Order): boolean {
  return !NON_REVENUE.includes(order.status);
}

export const REVENUE_DAYS = 14;
export const TOP_PRODUCT_LIMIT = 5;
export const RECENT_ORDER_LIMIT = 5;

export interface DashboardStats {
  currency: string;
  revenue: number;
  orderCount: number;
  openOrderCount: number;
  customerCount: number;
  productCount: number;
  outOfStockCount: number;
  /**
   * Share (0–1) of visits that ended in an order. null = not measurable: the
   * demo collects no visit/session data, and orders linked to accounts can't
   * supply a visitor denominator, so there is nothing honest to divide by.
   * Never fabricated; only computed once a real definition exists.
   */
  conversion: number | null;
  revenueByDay: { date: string; revenue: number }[];
  topProducts: { productId: string; name: string; image: string; units: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    currency: string;
    status: OrderStatus;
    placedAt: string;
  }[];
}

/** Local calendar day key, e.g. "2026-09-30". */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computeDashboardStats(input: {
  orders: Order[];
  customerCount: number;
  products: ProductSummary[];
  now?: Date;
}): DashboardStats {
  const { orders, customerCount, products } = input;
  const now = input.now ?? new Date();
  const counted = orders.filter(isRevenueOrder);

  const revenue = counted.reduce((sum, o) => sum + o.total, 0);

  // Zero-filled so days with no sales still appear on the chart.
  const days = new Map<string, number>();
  for (let i = REVENUE_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.set(toDayKey(d), 0);
  }
  for (const order of counted) {
    const key = toDayKey(new Date(order.placedAt));
    if (days.has(key)) days.set(key, (days.get(key) ?? 0) + order.total);
  }

  const byProduct = new Map<string, DashboardStats["topProducts"][number]>();
  for (const order of counted) {
    for (const item of order.items) {
      const line = item.unitPrice * item.quantity;
      const existing = byProduct.get(item.productId);
      if (existing) {
        existing.units += item.quantity;
        existing.revenue += line;
      } else {
        byProduct.set(item.productId, {
          productId: item.productId,
          name: item.name,
          image: item.image,
          units: item.quantity,
          revenue: line,
        });
      }
    }
  }

  return {
    currency: orders[0]?.currency ?? "USD",
    revenue,
    orderCount: orders.length,
    openOrderCount: orders.filter((o) => OPEN.includes(o.status)).length,
    customerCount,
    productCount: products.length,
    outOfStockCount: products.filter((p) => !p.inStock).length,
    conversion: null,
    revenueByDay: [...days].map(([date, value]) => ({ date, revenue: value })),
    topProducts: [...byProduct.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, TOP_PRODUCT_LIMIT),
    recentOrders: [...orders]
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
      .slice(0, RECENT_ORDER_LIMIT)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.shippingAddress.fullName,
        total: o.total,
        currency: o.currency,
        status: o.status,
        placedAt: o.placedAt,
      })),
  };
}
