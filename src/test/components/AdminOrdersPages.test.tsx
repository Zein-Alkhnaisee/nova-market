import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { AdminOrdersPage } from "../../pages/admin/AdminOrdersPage";
import { AdminOrderDetailPage } from "../../pages/admin/AdminOrderDetailPage";
import { createTestStore, renderWithProviders } from "../renderWithProviders";
import { authApi } from "../../services/api/authApi";
import { listAllOrders, ordersApi, updateOrderStatus, type PlaceOrderInput } from "../../services/api/ordersApi";
import type { User } from "../../types/user";

function App() {
  return (
    <Routes>
      <Route path="/admin/orders" element={<AdminOrdersPage />} />
      <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
    </Routes>
  );
}

const orderInput = (recipient: string, price: number, customerId?: string): PlaceOrderInput => ({
  lines: [{ productId: "p1", slug: "p1", name: `${recipient} Widget`, image: "i.jpg", price, currency: "USD", quantity: 2 }],
  shippingAddress: { fullName: recipient, line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" },
  deliveryOption: { id: "s", label: "Standard", etaDays: "5 business days", price: 0 },
  discountPercent: 0,
  paymentSummary: { brand: "Visa", last4: "4242" },
  customerId,
});
const usd = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(n);
const dataRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);
const place = async (store: ReturnType<typeof createTestStore>, input: PlaceOrderInput) =>
  ((await store.dispatch(ordersApi.endpoints.placeOrder.initiate(input))) as { data: { id: string; orderNumber: string } }).data;

// The mock order and user stores are module-level state shared by every test in
// this file, so these tests are order-dependent by necessity: the empty state
// must run first, before any order is placed.
describe("Admin orders", () => {
  it("shows a skeleton, then a designed empty state when there are no orders", async () => {
    renderWithProviders(<App />, { route: "/admin/orders" });
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    expect(await screen.findByText("No orders yet")).toBeInTheDocument();
  });

  it("lists orders newest first with customer names, a No-account marker, status badges and totals, and filters them", async () => {
    const store = createTestStore();
    const ada = ((await store.dispatch(authApi.endpoints.register.initiate({ fullName: "Ada Byron", email: `ada-${Date.now()}@example.com`, password: "password123" }))) as { data: User }).data;
    const linked = await place(store, orderInput("Ada Recipient", 100, ada.id));
    const guest = await place(store, orderInput("Gus Guest", 40));
    updateOrderStatus(guest.id, "cancelled");

    renderWithProviders(<App />, { route: "/admin/orders", store });
    await screen.findByRole("table", { name: "Orders" });
    const rows = dataRows();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent(guest.orderNumber); // newest first
    expect(rows[0]).toHaveTextContent("Gus Guest");
    expect(rows[0]).toHaveTextContent("No account");
    expect(rows[0]).toHaveTextContent("Cancelled");
    expect(rows[1]).toHaveTextContent("Ada Byron"); // linked account name, not the recipient
    expect(rows[1]).toHaveTextContent(usd(216)); // 2 × 100 + 8% tax
    expect(rows[1]).toHaveTextContent(linked.orderNumber);

    await userEvent.type(screen.getByLabelText("Search orders"), "ada");
    expect(dataRows()).toHaveLength(1);
    await userEvent.clear(screen.getByLabelText("Search orders"));
    await userEvent.selectOptions(screen.getByLabelText("Status"), "cancelled");
    expect(dataRows()).toHaveLength(1);
    expect(dataRows()[0]).toHaveTextContent("Gus Guest");

    await userEvent.type(screen.getByLabelText("Search orders"), "zzzz");
    expect(await screen.findByText("No orders match these filters")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(dataRows()).toHaveLength(2);
  });

  it("opens an order's detail: items, linked customer, address, masked payment, totals and timeline", async () => {
    renderWithProviders(<App />, { route: "/admin/orders" });
    await screen.findByRole("table", { name: "Orders" });
    const adaRow = dataRows().find((r) => r.textContent?.includes("Ada Byron"))!;
    await userEvent.click(within(adaRow).getByRole("link"));

    expect(await screen.findByRole("heading", { name: /NV-/ })).toBeInTheDocument();
    expect(screen.getByText("Ada Recipient Widget")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ada Byron" })).toHaveAttribute("href", expect.stringMatching(/^\/admin\/customers\//));
    expect(screen.getByText(/Visa ending in 4242/)).toBeInTheDocument();
    expect(screen.queryByText(/4242424242424242/)).not.toBeInTheDocument();
    expect(within(screen.getByRole("heading", { name: "Timeline" }).closest("div")!).getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All orders" })).toBeInTheDocument();
  });

  it("renders the shipping phone number as a left-to-right isolate so it can't scramble in RTL", async () => {
    const store = createTestStore();
    const order = await place(store, orderInput("Pia Phone", 30));
    renderWithProviders(<App />, { route: `/admin/orders/${order.id}`, store });
    const phone = await screen.findByText("+14155550100");
    expect(phone.tagName).toBe("BDI");
    expect(phone).toHaveAttribute("dir", "ltr");
  });

  it("shows a guest order as not linked to an account", async () => {
    const guestOrder = listAllOrders().find((o) => !o.customerId)!;
    renderWithProviders(<App />, { route: `/admin/orders/${guestOrder.id}` });
    expect(await screen.findByText(/Not linked to an account/)).toBeInTheDocument();
  });

  it("moves an order forward in one click, with a live notice, new badge, new timeline entry and the next actions", async () => {
    const store = createTestStore();
    const order = await place(store, orderInput("Fiona Forward", 30));
    renderWithProviders(<App />, { route: `/admin/orders/${order.id}`, store });

    await userEvent.click(await screen.findByRole("button", { name: "Start processing" }));
    expect(await screen.findByText("Order marked as Processing.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Mark as shipped" })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Start processing" })).not.toBeInTheDocument();
    expect(listAllOrders().find((o) => o.id === order.id)?.status).toBe("processing");
    const timeline = within(screen.getByRole("heading", { name: "Timeline" }).closest("div")!);
    expect(timeline.getByText("Processing")).toBeInTheDocument();
  });

  it("confirms before cancelling, with focus on the safe choice, and the order becomes final", async () => {
    const store = createTestStore();
    const order = await place(store, orderInput("Cora Cancel", 30));
    renderWithProviders(<App />, { route: `/admin/orders/${order.id}`, store });

    await userEvent.click(await screen.findByRole("button", { name: "Cancel order" }));
    const dialog = screen.getByRole("alertdialog", { name: "Cancel this order?" });
    expect(within(dialog).getByRole("button", { name: "Keep as is" })).toHaveFocus();
    expect(listAllOrders().find((o) => o.id === order.id)?.status).toBe("confirmed"); // nothing yet

    await userEvent.click(within(dialog).getByRole("button", { name: "Keep as is" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancel order" }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel order" }));
    expect(await screen.findByText("Order marked as Cancelled.")).toBeInTheDocument();
    expect(await screen.findByText(/final status and can't be changed/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start processing" })).not.toBeInTheDocument();
  });

  it("explains a stale-state conflict (409) instead of silently failing", async () => {
    const store = createTestStore();
    const order = await place(store, orderInput("Stan Stale", 30));
    renderWithProviders(<App />, { route: `/admin/orders/${order.id}`, store });
    const button = await screen.findByRole("button", { name: "Start processing" });

    updateOrderStatus(order.id, "cancelled"); // changed elsewhere after this page loaded
    await userEvent.click(button);
    // The message names the order's ACTUAL current status (Cancelled), not the stale one the page loaded with.
    expect(await screen.findByRole("alert")).toHaveTextContent(/can't move from Cancelled to Processing/i);
    expect(listAllOrders().find((o) => o.id === order.id)?.status).toBe("cancelled");
  });

  it("shows not-found for an unknown order", async () => {
    renderWithProviders(<App />, { route: "/admin/orders/does-not-exist" });
    expect(await screen.findByText("There's no order with that id.")).toBeInTheDocument();
  });

  it("shows a human-readable error on the list and recovers on retry", async () => {
    const mod = await import("../../services/api/ordersApi");
    const real = mod.listAllOrders;
    let calls = 0;
    const spy = vi.spyOn(mod, "listAllOrders").mockImplementation(() => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return real();
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(<App />, { route: "/admin/orders" });
    expect(await screen.findByText("We couldn't load orders right now.")).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("table", { name: "Orders" })).toBeInTheDocument();

    spy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("confirms before refunding a delivered order, defaulting focus to the safe choice", async () => {
    const store = createTestStore();
    const order = await place(store, orderInput("Rita Refund", 30));
    for (const to of ["processing", "shipped", "out_for_delivery", "delivered"] as const) updateOrderStatus(order.id, to);
    renderWithProviders(<App />, { route: `/admin/orders/${order.id}`, store });

    // Delivered orders offer only the refund — and it's the destructive, confirmed one.
    expect(screen.queryByRole("button", { name: "Cancel order" })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Refund order" }));
    const dialog = screen.getByRole("alertdialog", { name: "Refund this order?" });
    expect(within(dialog).getByRole("button", { name: "Keep as is" })).toHaveFocus();
    expect(listAllOrders().find((o) => o.id === order.id)?.status).toBe("delivered"); // nothing yet

    await userEvent.click(within(dialog).getByRole("button", { name: "Refund order" }));
    expect(await screen.findByText("Order marked as Refunded.")).toBeInTheDocument();
    expect(await screen.findByText(/final status and can't be changed/i)).toBeInTheDocument();
    expect(listAllOrders().find((o) => o.id === order.id)?.status).toBe("refunded");
  });

  it("shows a human-readable error on the detail page and recovers on retry", async () => {
    const store = createTestStore();
    const order = await place(store, orderInput("Dee Detail", 30));
    const mod = await import("../../services/api/ordersApi");
    const real = mod.listAllOrders;
    let calls = 0;
    const spy = vi.spyOn(mod, "listAllOrders").mockImplementation(() => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return real();
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(<App />, { route: `/admin/orders/${order.id}`, store });
    expect(await screen.findByText("We couldn't load this order right now.")).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("button", { name: "Start processing" })).toBeInTheDocument();

    spy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("ignores an invalid ?status= instead of filtering to nothing while the dropdown says All", async () => {
    const store = createTestStore();
    await place(store, orderInput("Ivy Invalid", 30));
    renderWithProviders(<App />, { route: "/admin/orders?status=bogus", store });
    const table = await screen.findByRole("table", { name: "Orders" });
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(1); // not the empty "no match" state
    expect(screen.getByLabelText("Status")).toHaveValue("");
  });

  it("links each order number to its admin detail page", async () => {
    const store = createTestStore();
    const order = await place(store, orderInput("Lena Link", 30));
    renderWithProviders(<App />, { route: "/admin/orders", store });
    const link = await screen.findByRole("link", { name: order.orderNumber });
    expect(link).toHaveAttribute("href", `/admin/orders/${order.id}`);
  });
});

