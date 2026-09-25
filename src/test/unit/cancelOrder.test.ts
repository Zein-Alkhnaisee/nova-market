import { describe, expect, it, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { ordersApi } from "../../services/api/ordersApi";
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
  city: "SF",
  region: "CA",
  postalCode: "94105",
  country: "US",
  phone: "+14155550100",
};
const delivery: DeliveryOption = { id: "standard", label: "Standard", etaDays: "5-7 days", price: 6 };
const lines: CartLine[] = [
  { productId: "p1", slug: "p1", name: "Widget", image: "i.jpg", price: 50, currency: "USD", quantity: 1 },
];

async function placeTestOrder(store: ReturnType<typeof createTestStore>) {
  const result = await store.dispatch(
    ordersApi.endpoints.placeOrder.initiate({
      lines,
      shippingAddress: address,
      deliveryOption: delivery,
      discountPercent: 0,
      paymentSummary: { brand: "Visa", last4: "4242" },
    })
  );
  return (result as { data: Order }).data;
}

describe("ordersApi — cancelOrder", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    window.localStorage.clear();
    store = createTestStore();
  });

  it("cancels a confirmed order and appends a cancelled timeline entry", async () => {
    const order = await placeTestOrder(store);
    const result = await store.dispatch(ordersApi.endpoints.cancelOrder.initiate(order.id));
    expect("data" in result).toBe(true);
    const updated = (result as { data: Order }).data;
    expect(updated.status).toBe("cancelled");
    expect(updated.timeline.at(-1)?.status).toBe("cancelled");
  });

  it("persists the cancellation so a later fetch sees it", async () => {
    const order = await placeTestOrder(store);
    await store.dispatch(ordersApi.endpoints.cancelOrder.initiate(order.id));
    const fetched = await store.dispatch(
      ordersApi.endpoints.getOrderById.initiate(order.id, { forceRefetch: true })
    );
    expect(fetched.data?.status).toBe("cancelled");
  });

  it("errors for an unknown order id", async () => {
    const result = await store.dispatch(ordersApi.endpoints.cancelOrder.initiate("no-such-order"));
    expect("error" in result).toBe(true);
  });

  it("refuses to cancel an order that is already cancelled", async () => {
    const order = await placeTestOrder(store);
    await store.dispatch(ordersApi.endpoints.cancelOrder.initiate(order.id));
    const second = await store.dispatch(ordersApi.endpoints.cancelOrder.initiate(order.id));
    expect("error" in second).toBe(true);
  });
});
