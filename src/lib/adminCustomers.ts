import { isRevenueOrder } from "./adminStats";
import type { Order } from "../types/order";
import type { User } from "../types/user";

export interface CustomerSummary {
  id: string;
  fullName: string;
  email: string;
  orderCount: number;
  /** Sum of orders that count as revenue (not cancelled/refunded). */
  lifetimeSpend: number;
  lastOrderAt: string | null;
  currency: string;
}

export interface CustomerDetail {
  customer: User;
  /** Newest first. */
  orders: Order[];
  orderCount: number;
  lifetimeSpend: number;
  /** null when no order counts as revenue — there is nothing to average. */
  averageOrderValue: number | null;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  currency: string;
}

const byNewest = (a: Order, b: Order) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();

/**
 * Links orders to accounts by `Order.customerId`. Orders with no customerId
 * (guest checkout, or placed before the field existed) or whose customerId
 * matches no current account can't be attributed; they are counted, not hidden.
 */
export function buildCustomerSummaries(
  customers: User[],
  orders: Order[]
): { customers: CustomerSummary[]; unlinkedOrderCount: number } {
  const ids = new Set(customers.map((c) => c.id));
  const currency = orders[0]?.currency ?? "USD";

  const summaries = customers.map((customer): CustomerSummary => {
    const mine = orders.filter((o) => o.customerId === customer.id).sort(byNewest);
    return {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      orderCount: mine.length,
      lifetimeSpend: mine.filter(isRevenueOrder).reduce((sum, o) => sum + o.total, 0),
      lastOrderAt: mine[0]?.placedAt ?? null,
      currency,
    };
  });

  summaries.sort((a, b) => b.lifetimeSpend - a.lifetimeSpend || a.fullName.localeCompare(b.fullName));

  return {
    customers: summaries,
    unlinkedOrderCount: orders.filter((o) => !o.customerId || !ids.has(o.customerId)).length,
  };
}

export function buildCustomerDetail(customer: User, orders: Order[]): CustomerDetail {
  const mine = orders.filter((o) => o.customerId === customer.id).sort(byNewest);
  const counted = mine.filter(isRevenueOrder);
  const lifetimeSpend = counted.reduce((sum, o) => sum + o.total, 0);
  return {
    customer,
    orders: mine,
    orderCount: mine.length,
    lifetimeSpend,
    averageOrderValue: counted.length > 0 ? lifetimeSpend / counted.length : null,
    firstOrderAt: mine[mine.length - 1]?.placedAt ?? null,
    lastOrderAt: mine[0]?.placedAt ?? null,
    currency: mine[0]?.currency ?? orders[0]?.currency ?? "USD",
  };
}
