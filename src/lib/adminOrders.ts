import { allowedNextStatuses } from "./orderTransitions";
import type { Order, OrderStatus } from "../types/order";
import type { User } from "../types/user";

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  /** Linked account's name, else the shipping recipient's. */
  customerName: string;
  /** Set only when the order is linked to an existing customer account. */
  customerId: string | null;
  total: number;
  currency: string;
  placedAt: string;
  itemCount: number;
}

export interface AdminOrderDetail {
  order: Order;
  /** null for guest orders, orders placed before `customerId` existed, or a customer account that no longer exists. */
  customer: { id: string; fullName: string; email: string } | null;
  /** Statuses an admin may move this order to right now. */
  allowedNext: OrderStatus[];
}

const byNewest = (a: Order, b: Order) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();

function linkedCustomer(order: Order, customers: User[]) {
  return order.customerId ? customers.find((c) => c.id === order.customerId) ?? null : null;
}

export function buildOrderRows(orders: Order[], customers: User[]): AdminOrderRow[] {
  return [...orders].sort(byNewest).map((order) => {
    const customer = linkedCustomer(order, customers);
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: customer?.fullName ?? order.shippingAddress.fullName,
      customerId: customer?.id ?? null,
      total: order.total,
      currency: order.currency,
      placedAt: order.placedAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
}

export function buildOrderDetail(order: Order, customers: User[]): AdminOrderDetail {
  const customer = linkedCustomer(order, customers);
  return {
    order,
    customer: customer ? { id: customer.id, fullName: customer.fullName, email: customer.email } : null,
    allowedNext: allowedNextStatuses(order.status),
  };
}
