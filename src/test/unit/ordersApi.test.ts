import { describe, expect, it, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { ordersApi } from "../../services/api/ordersApi";
import { loadPersisted } from "../../lib/persist";
import type { CartLine } from "../../types/cart";
import type { DeliveryOption, Order, ShippingAddress } from "../../types/order";

function createTestStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

const address: ShippingAddress = {
  fullName: "Jordan Lee",
  line1: "1 Market St",
  city: "San Francisco",
  region: "CA",
  postalCode: "94105",
  country: "US",
  phone: "+1 415 555 0100",
};

const delivery: DeliveryOption = { id: "express", label: "Express", etaDays: "2-3 days", price: 16 };

const lines: CartLine[] = [
  { productId: "p1", slug: "p1", name: "Widget", image: "img.jpg", price: 50, currency: "USD", quantity: 2 },
];

describe("ordersApi", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    window.localStorage.clear();
    store = createTestStore();
  });

  it("creates an order with a generated order number and correct pricing", async () => {
    const result = await store.dispatch(
      ordersApi.endpoints.placeOrder.initiate({
        lines,
        shippingAddress: address,
        deliveryOption: delivery,
        discountPercent: 10,
        paymentSummary: { brand: "Visa", last4: "4242" },
      })
    );
    expect("data" in result).toBe(true);
    const order = (result as { data: Order }).data;
    expect(order.orderNumber).toMatch(/^NV-\d{6}$/);
    expect(order.subtotal).toBe(100);
    expect(order.discount).toBe(10);
    expect(order.shipping).toBe(16);
    expect(order.total).toBeCloseTo(100 - 10 + 16 + (100 - 10) * 0.08, 2);
    expect(order.status).toBe("confirmed");
    expect(order.paymentSummary).toEqual({ brand: "Visa", last4: "4242" });
  });

  it("persists the order to localStorage", async () => {
    await store.dispatch(
      ordersApi.endpoints.placeOrder.initiate({
        lines,
        shippingAddress: address,
        deliveryOption: delivery,
        discountPercent: 0,
        paymentSummary: { brand: "Visa", last4: "4242" },
      })
    );
    const stored = loadPersisted<Order[]>("orders", []);
    expect(stored.length).toBeGreaterThan(0);
  });

  it("getOrders returns the newest order first", async () => {
    await store.dispatch(
      ordersApi.endpoints.placeOrder.initiate({
        lines,
        shippingAddress: address,
        deliveryOption: delivery,
        discountPercent: 0,
        paymentSummary: { brand: "Visa", last4: "1111" },
      })
    );
    await store.dispatch(
      ordersApi.endpoints.placeOrder.initiate({
        lines,
        shippingAddress: address,
        deliveryOption: delivery,
        discountPercent: 0,
        paymentSummary: { brand: "Visa", last4: "2222" },
      })
    );
    const result = await store.dispatch(ordersApi.endpoints.getOrders.initiate());
    expect(result.data?.[0]?.paymentSummary.last4).toBe("2222");
  });

  it("getOrderById finds the right order", async () => {
    const placed = await store.dispatch(
      ordersApi.endpoints.placeOrder.initiate({
        lines,
        shippingAddress: address,
        deliveryOption: delivery,
        discountPercent: 0,
        paymentSummary: { brand: "Visa", last4: "4242" },
      })
    );
    const order = (placed as { data: Order }).data;
    const result = await store.dispatch(ordersApi.endpoints.getOrderById.initiate(order.id));
    expect(result.data?.id).toBe(order.id);
  });

  it("never stores raw card data — only the masked brand/last4 summary", async () => {
    const result = await store.dispatch(
      ordersApi.endpoints.placeOrder.initiate({
        lines,
        shippingAddress: address,
        deliveryOption: delivery,
        discountPercent: 0,
        paymentSummary: { brand: "Visa", last4: "4242" },
      })
    );
    const order = (result as { data: Order }).data;
    const serialized = JSON.stringify(order);
    // The full mock card number used in the payment step's placeholder must
    // never be reachable from an order record.
    expect(serialized).not.toMatch(/4242424242424242/);
    expect(Object.keys(order.paymentSummary).sort()).toEqual(["brand", "last4"]);
  });
});
