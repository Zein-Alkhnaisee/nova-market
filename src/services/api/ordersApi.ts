import { baseApi } from "./baseApi";
import { delay } from "../../lib/delay";
import { loadPersisted, savePersisted } from "../../lib/persist";
import { computePricing } from "../../lib/pricing";
import { generateId } from "../../lib/id";
import type { CartLine } from "../../types/cart";
import type { DeliveryOption, Order, OrderStatus, ShippingAddress } from "../../types/order";

let orderStore: Order[] = loadPersisted<Order[]>("orders", []);

function persistOrders() {
  savePersisted("orders", orderStore);
}

function generateOrderNumber() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `NV-${random}`;
}

function estimateDeliveryDate(etaDays: string) {
  // Parse the leading number out of strings like "5–7 business days" / "1 business day".
  const match = etaDays.match(/\d+/g);
  const maxDays = match ? Number(match[match.length - 1]) : 5;
  const date = new Date();
  date.setDate(date.getDate() + maxDays);
  return date.toISOString();
}

export interface PlaceOrderInput {
  lines: CartLine[];
  shippingAddress: ShippingAddress;
  deliveryOption: DeliveryOption;
  discountPercent: number;
  paymentSummary: { brand: string; last4: string };
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    placeOrder: builder.mutation<Order, PlaceOrderInput>({
      queryFn: async (input) => {
        const pricing = computePricing(input.lines, {
          deliveryOption: input.deliveryOption,
          discountPercent: input.discountPercent,
        });
        const now = new Date().toISOString();
        const order: Order = {
          id: generateId("order"),
          orderNumber: generateOrderNumber(),
          items: input.lines.map((line) => ({
            productId: line.productId,
            slug: line.slug,
            name: line.name,
            image: line.image,
            unitPrice: line.price,
            quantity: line.quantity,
            currency: line.currency,
          })),
          subtotal: pricing.subtotal,
          discount: pricing.discount,
          shipping: pricing.shipping,
          tax: pricing.tax,
          total: pricing.total,
          currency: input.lines[0]?.currency ?? "USD",
          shippingAddress: input.shippingAddress,
          deliveryOption: input.deliveryOption,
          paymentSummary: input.paymentSummary,
          status: "confirmed" as OrderStatus,
          timeline: [
            { status: "pending", timestamp: now },
            { status: "confirmed", timestamp: now },
          ],
          placedAt: now,
          estimatedDelivery: estimateDeliveryDate(input.deliveryOption.etaDays),
        };
        orderStore = [order, ...orderStore];
        persistOrders();
        return { data: await delay(order, 600) };
      },
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),
    getOrders: builder.query<Order[], void>({
      queryFn: async () => ({ data: await delay(orderStore, 200) }),
      providesTags: (result) =>
        result
          ? [...result.map((o) => ({ type: "Order" as const, id: o.id })), { type: "Order" as const, id: "LIST" }]
          : [{ type: "Order" as const, id: "LIST" }],
    }),
    getOrderById: builder.query<Order | undefined, string>({
      queryFn: async (id) => ({ data: await delay(orderStore.find((o) => o.id === id), 200) }),
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    cancelOrder: builder.mutation<Order, string>({
      queryFn: async (id) => {
        const index = orderStore.findIndex((o) => o.id === id);
        if (index < 0) {
          return { error: { status: 404, message: "Order not found." } };
        }
        const existing = orderStore[index];
        // Only orders that haven't shipped yet can be cancelled — mirrors what
        // a real fulfilment backend would enforce, rather than letting the UI
        // pretend any order is cancellable.
        const cancellable: OrderStatus[] = ["pending", "confirmed", "processing"];
        if (!cancellable.includes(existing.status)) {
          return { error: { status: 409, message: "This order can no longer be cancelled." } };
        }
        const updated: Order = {
          ...existing,
          status: "cancelled",
          timeline: [...existing.timeline, { status: "cancelled", timestamp: new Date().toISOString() }],
        };
        orderStore = [...orderStore.slice(0, index), updated, ...orderStore.slice(index + 1)];
        persistOrders();
        return { data: await delay(updated, 300) };
      },
      invalidatesTags: (_r, _e, id) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
      ],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
} = ordersApi;
