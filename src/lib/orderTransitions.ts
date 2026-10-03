import type { OrderStatus } from "../types/order";

/**
 * Order lifecycle (admin side). Forward-only: an order never goes backwards,
 * and "cancelled" / "refunded" are terminal.
 *
 *   pending → confirmed → processing → shipped → out_for_delivery → delivered → refunded
 *   (pending | confirmed | processing) → cancelled
 *
 * Cancellation is only possible before an order ships — the same set the
 * customer-facing `cancelOrder` allows, so the storefront and the admin agree
 * (a test pins that equality). Enforced in the API layer (`updateOrderStatus`),
 * not just by hiding buttons.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export const allowedNextStatuses = (status: OrderStatus): OrderStatus[] => ALLOWED_TRANSITIONS[status] ?? [];

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean => allowedNextStatuses(from).includes(to);

/** Irreversible targets the admin UI asks to confirm. */
export const isDestructiveTransition = (to: OrderStatus): boolean => to === "cancelled" || to === "refunded";
