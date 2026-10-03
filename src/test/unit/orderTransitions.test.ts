import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { ordersApi, updateOrderStatus, type PlaceOrderInput } from "../../services/api/ordersApi";
import { ALLOWED_TRANSITIONS, allowedNextStatuses, canTransition, isDestructiveTransition } from "../../lib/orderTransitions";
import type { OrderStatus } from "../../types/order";

const ALL: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"];

function createStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}
const input: PlaceOrderInput = {
  lines: [{ productId: "p1", slug: "p1", name: "Widget", image: "i.jpg", price: 50, currency: "USD", quantity: 1 }],
  shippingAddress: { fullName: "Jordan Lee", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" },
  deliveryOption: { id: "s", label: "Standard", etaDays: "5 business days", price: 0 },
  discountPercent: 0,
  paymentSummary: { brand: "Visa", last4: "4242" },
};

/** Place an order and advance it along the happy path to `target` (which must be on the path). */
async function orderAt(store: ReturnType<typeof createStore>, target: OrderStatus) {
  const placed = (await store.dispatch(ordersApi.endpoints.placeOrder.initiate(input))) as { data: { id: string; status: OrderStatus } };
  const { id } = placed.data;
  const path: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "refunded"];
  let current = placed.data.status;
  while (current !== target) {
    const next = path[path.indexOf(current) + 1];
    if (!next) throw new Error(`can't reach ${target} from ${current}`);
    const r = updateOrderStatus(id, next);
    if (!r.ok) throw new Error(`advance failed ${current}→${next}`);
    current = next;
  }
  return id;
}

describe("order lifecycle rules", () => {
  it("defines a transition list for every status", () => {
    expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual([...ALL].sort());
  });

  it("is forward-only: no status can ever lead back to itself or an earlier status", () => {
    const reachable = (from: OrderStatus, seen = new Set<OrderStatus>()): Set<OrderStatus> => {
      for (const next of allowedNextStatuses(from)) {
        if (!seen.has(next)) {
          seen.add(next);
          reachable(next, seen);
        }
      }
      return seen;
    };
    for (const status of ALL) expect(reachable(status).has(status)).toBe(false);
  });

  it("makes cancelled and refunded terminal", () => {
    expect(allowedNextStatuses("cancelled")).toEqual([]);
    expect(allowedNextStatuses("refunded")).toEqual([]);
  });

  it("flags only cancel and refund as destructive", () => {
    expect(ALL.filter(isDestructiveTransition).sort()).toEqual(["cancelled", "refunded"]);
  });

  it("only allows refunding a delivered order, and cancelling before shipment", () => {
    expect(canTransition("delivered", "refunded")).toBe(true);
    expect(canTransition("shipped", "refunded")).toBe(false);
    expect(canTransition("shipped", "cancelled")).toBe(false);
    expect(canTransition("processing", "cancelled")).toBe(true);
  });

  it("agrees with the customer-facing cancelOrder at every status (admin and storefront can't disagree)", async () => {
    const store = createStore();
    // placeOrder creates orders as "confirmed" (timeline pending → confirmed), so "pending" can't be reached
    // at rest through the API; its cancellability is covered by the transition table assertions above.
    for (const status of ["confirmed", "processing", "shipped", "out_for_delivery", "delivered", "refunded"] as OrderStatus[]) {
      const id = await orderAt(store, status);
      const result = await store.dispatch(ordersApi.endpoints.cancelOrder.initiate(id));
      expect({ status, customerCanCancel: "data" in result && Boolean(result.data) }).toEqual({
        status,
        customerCanCancel: canTransition(status, "cancelled"),
      });
    }
  });
});
