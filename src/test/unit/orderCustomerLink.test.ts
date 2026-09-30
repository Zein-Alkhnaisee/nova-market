import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { listAllOrders, ordersApi, type PlaceOrderInput } from "../../services/api/ordersApi";

function createStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

const base: PlaceOrderInput = {
  lines: [{ productId: "p1", slug: "p1", name: "Widget", image: "i.jpg", price: 50, currency: "USD", quantity: 1 }],
  shippingAddress: { fullName: "Jordan Lee", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" },
  deliveryOption: { id: "s", label: "Standard", etaDays: "5 business days", price: 0 },
  discountPercent: 0,
  paymentSummary: { brand: "Visa", last4: "4242" },
};

describe("Order → customer link (Phase 12 enabler)", () => {
  it("stores the customerId on the order and persists it", async () => {
    const store = createStore();
    const result = await store.dispatch(ordersApi.endpoints.placeOrder.initiate({ ...base, customerId: "user-123" }));
    const order = (result as { data: { id: string; customerId?: string } }).data;
    expect(order.customerId).toBe("user-123");
    expect(JSON.parse(window.localStorage.getItem("nova:orders") ?? "[]")[0].customerId).toBe("user-123");
  });

  it("leaves customerId off entirely for guest orders, and they still load and read normally", async () => {
    const store = createStore();
    const result = await store.dispatch(ordersApi.endpoints.placeOrder.initiate(base));
    const placed = (result as { data: { id: string } }).data;
    expect(placed).not.toHaveProperty("customerId");

    const list = await store.dispatch(ordersApi.endpoints.getOrders.initiate());
    expect(list.data?.some((o) => o.id === placed.id)).toBe(true);
    const one = await store.dispatch(ordersApi.endpoints.getOrderById.initiate(placed.id));
    expect(one.data?.id).toBe(placed.id);
    expect(listAllOrders().find((o) => o.id === placed.id)).toBeDefined();
  });

  it("does not put customerId into the storefront pricing or card data", async () => {
    const store = createStore();
    const result = await store.dispatch(ordersApi.endpoints.placeOrder.initiate({ ...base, customerId: "user-9" }));
    if (!("data" in result) || !result.data) throw new Error("order was not placed");
    const order: Record<string, unknown> = { ...result.data };
    expect(Object.keys(order)).not.toContain("cardNumber");
    expect(order.total).toBe(54); // 50 + 8% tax, free shipping: unchanged by the new field
  });
});
