import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { adminApi } from "../../services/api/adminApi";
import { listAllOrders, ordersApi, updateOrderStatus, type PlaceOrderInput } from "../../services/api/ordersApi";

function createStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}
const CARD = "4242424242424242";
const input: PlaceOrderInput = {
  lines: [{ productId: "p1", slug: "p1", name: "Widget", image: "i.jpg", price: 50, currency: "USD", quantity: 1 }],
  shippingAddress: { fullName: "Jordan Lee", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" },
  deliveryOption: { id: "s", label: "Standard", etaDays: "5 business days", price: 0 },
  discountPercent: 0,
  paymentSummary: { brand: "Visa", last4: "4242" },
};
const place = async (store: ReturnType<typeof createStore>) =>
  ((await store.dispatch(ordersApi.endpoints.placeOrder.initiate(input))) as { data: { id: string; status: string; timeline: unknown[] } }).data;
async function poll(check: () => boolean, ms = 3000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("condition not met in time");
}

describe("updateOrderStatus (admin)", () => {
  it("advances a legal step, appends a timeline entry, and persists", async () => {
    const order = await place(createStore());
    const r = updateOrderStatus(order.id, "processing");
    if (!r.ok) throw new Error("expected ok");
    expect(r.order.status).toBe("processing");
    expect(r.order.timeline).toHaveLength(order.timeline.length + 1);
    expect(r.order.timeline.at(-1)).toMatchObject({ status: "processing" });
    const stored = JSON.parse(window.localStorage.getItem("nova:orders") ?? "[]");
    expect(stored.find((o: { id: string }) => o.id === order.id).status).toBe("processing");
  });

  it("rejects an illegal move with 409 and changes nothing", async () => {
    const order = await place(createStore());
    const before = JSON.stringify(listAllOrders().find((o) => o.id === order.id));
    expect(updateOrderStatus(order.id, "delivered")).toEqual({ ok: false, status: 409, reason: "illegalTransition", from: "confirmed", to: "delivered" });
    expect(updateOrderStatus(order.id, "confirmed")).toMatchObject({ ok: false, status: 409 }); // no no-op "transitions"
    expect(JSON.stringify(listAllOrders().find((o) => o.id === order.id))).toBe(before);
  });

  it("treats cancelled as final, and 404s on an unknown id", async () => {
    const order = await place(createStore());
    expect(updateOrderStatus(order.id, "cancelled").ok).toBe(true);
    expect(updateOrderStatus(order.id, "processing")).toMatchObject({ ok: false, status: 409 });
    expect(updateOrderStatus("nope", "processing")).toEqual({ ok: false, status: 404 });
  });

  it("never touches card data: only the masked summary survives a full lifecycle", async () => {
    const order = await place(createStore());
    for (const to of ["processing", "shipped", "out_for_delivery", "delivered", "refunded"] as const) updateOrderStatus(order.id, to);
    const serialised = JSON.stringify(listAllOrders()) + (window.localStorage.getItem("nova:orders") ?? "");
    expect(serialised).not.toContain(CARD);
    expect(listAllOrders().find((o) => o.id === order.id)?.paymentSummary).toEqual({ brand: "Visa", last4: "4242" });
  });
});

describe("admin status changes reach the customer-facing order pages", () => {
  it("a mounted customer getOrderById query shows the new status and timeline after an admin update", async () => {
    const store = createStore();
    const order = await place(store);
    const sub = store.dispatch(ordersApi.endpoints.getOrderById.initiate(order.id));
    await sub;

    const result = await store.dispatch(adminApi.endpoints.updateAdminOrderStatus.initiate({ id: order.id, to: "processing" }));
    expect("data" in result && result.data?.ok).toBe(true);

    await poll(() => ordersApi.endpoints.getOrderById.select(order.id)(store.getState()).data?.status === "processing");
    expect(ordersApi.endpoints.getOrderById.select(order.id)(store.getState()).data?.timeline.at(-1)?.status).toBe("processing");
    sub.unsubscribe();
  });

  it("after the admin ships an order, the customer can no longer cancel it (409)", async () => {
    const store = createStore();
    const order = await place(store);
    updateOrderStatus(order.id, "processing");
    updateOrderStatus(order.id, "shipped");
    const result = await store.dispatch(ordersApi.endpoints.cancelOrder.initiate(order.id));
    expect("error" in result && (result.error as { status: number }).status).toBe(409);
  });

  it("a rejected admin update invalidates nothing and leaves the order alone", async () => {
    const store = createStore();
    const order = await place(store);
    const result = await store.dispatch(adminApi.endpoints.updateAdminOrderStatus.initiate({ id: order.id, to: "refunded" }));
    expect("data" in result && result.data).toMatchObject({ ok: false, status: 409 });
    expect(listAllOrders().find((o) => o.id === order.id)?.status).toBe("confirmed");
  });

  it("the admin order detail query returns the linked customer, allowed next statuses, and 404s for an unknown id", async () => {
    const store = createStore();
    const order = await place(store);
    const detail = await store.dispatch(adminApi.endpoints.getAdminOrder.initiate(order.id));
    expect(detail.data?.allowedNext).toEqual(["processing", "cancelled"]);
    expect(detail.data?.customer).toBeNull(); // guest order
    const missing = await store.dispatch(adminApi.endpoints.getAdminOrder.initiate("nope"));
    expect((missing.error as { status: number }).status).toBe(404);
  });
});
