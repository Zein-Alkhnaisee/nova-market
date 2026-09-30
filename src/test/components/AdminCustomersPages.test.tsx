import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { AdminCustomersPage } from "../../pages/admin/AdminCustomersPage";
import { AdminCustomerDetailPage } from "../../pages/admin/AdminCustomerDetailPage";
import { createTestStore, renderWithProviders } from "../renderWithProviders";
import { authApi, SEEDED_ADMIN_EMAIL } from "../../services/api/authApi";
import { ordersApi, type PlaceOrderInput } from "../../services/api/ordersApi";
import type { User } from "../../types/user";

function App() {
  return (
    <Routes>
      <Route path="/admin/customers" element={<AdminCustomersPage />} />
      <Route path="/admin/customers/:id" element={<AdminCustomerDetailPage />} />
    </Routes>
  );
}

const orderInput = (name: string, price: number, customerId?: string): PlaceOrderInput => ({
  lines: [{ productId: "p1", slug: "p1", name: "Widget", image: "i.jpg", price, currency: "USD", quantity: 1 }],
  shippingAddress: { fullName: name, line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" },
  deliveryOption: { id: "s", label: "Standard", etaDays: "5 business days", price: 0 },
  discountPercent: 0,
  paymentSummary: { brand: "Visa", last4: "4242" },
  customerId,
});

const usd = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(n);

// The mock user and order stores are module-level state shared by every test in
// this file, so these tests are order-dependent by necessity: the empty state
// must run first, before any customer is registered.
describe("Admin customers", () => {
  it("shows a designed empty state when no customers exist", async () => {
    renderWithProviders(<App />, { route: "/admin/customers" });
    expect(await screen.findByText("No customers yet")).toBeInTheDocument();
  });

  it("lists customers with linked order counts and spend, notes unlinked orders, and searches", async () => {
    const store = createTestStore();
    const stamp = Date.now();
    const reg = async (fullName: string, email: string) =>
      ((await store.dispatch(authApi.endpoints.register.initiate({ fullName, email, password: "password123" }))) as { data: User }).data;
    const ada = await reg("Ada Byron", `ada-${stamp}@example.com`);
    await reg("Bob Chen", `bob-${stamp}@example.com`);

    await store.dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput("Ada", 100, ada.id)));
    const cancelled = (await store.dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput("Ada", 500, ada.id)))) as { data: { id: string } };
    await store.dispatch(ordersApi.endpoints.cancelOrder.initiate(cancelled.data.id));
    await store.dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput("Guest Person", 40))); // guest

    renderWithProviders(<App />, { route: "/admin/customers", store });
    const table = await screen.findByRole("table", { name: "Customers" });

    const rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Ada Byron"); // highest spend first
    expect(rows[1]).toHaveTextContent("2"); // both orders counted
    expect(rows[1]).toHaveTextContent(usd(108)); // 100 + 8% tax; cancelled order excluded
    expect(rows[2]).toHaveTextContent("Bob Chen");
    expect(rows[2]).toHaveTextContent("No orders yet");
    expect(screen.getByText(/1 order can't be linked to an account/i)).toBeInTheDocument();
    expect(screen.queryByText(SEEDED_ADMIN_EMAIL)).not.toBeInTheDocument(); // admins aren't customers

    await userEvent.type(screen.getByLabelText("Search customers"), "bob");
    expect(within(screen.getByRole("table")).queryByText("Ada Byron")).not.toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Search customers"));
    await userEvent.type(screen.getByLabelText("Search customers"), "zzz");
    expect(screen.getByText("No customers match your search")).toBeInTheDocument();
  });

  it("opens a customer's detail with their order history, excluding cancelled orders from spend", async () => {
    renderWithProviders(<App />, { route: "/admin/customers" });
    await userEvent.click(await screen.findByRole("link", { name: "Ada Byron" }));

    expect(await screen.findByRole("heading", { name: "Ada Byron" })).toBeInTheDocument();
    const history = screen.getByRole("table", { name: "Order history" });
    expect(within(history).getAllByRole("row")).toHaveLength(3); // header + 2 orders
    expect(within(history).getByText("Cancelled")).toBeInTheDocument();
    // One non-cancelled order, so lifetime spend and average order value are both $108.
    // The $540 cancelled order is in the history table but not in either KPI.
    expect(screen.getAllByText(usd(108), { selector: "p" })).toHaveLength(2);
    expect(screen.queryByText(usd(648), { selector: "p" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: "All customers" }));
    expect(await screen.findByRole("table", { name: "Customers" })).toBeInTheDocument();
  });

  it("shows a designed empty state, not an error, for a customer with no linked orders", async () => {
    renderWithProviders(<App />, { route: "/admin/customers" });
    await userEvent.click(await screen.findByRole("link", { name: "Bob Chen" }));
    expect(await screen.findByText("No orders linked to this customer")).toBeInTheDocument();
    expect(screen.getByText("Not available")).toBeInTheDocument(); // average order
    expect(screen.queryByText(/couldn't load/i)).not.toBeInTheDocument();
  });

  it("shows not-found for an unknown id, and for the admin account", async () => {
    const first = renderWithProviders(<App />, { route: "/admin/customers/nope" });
    expect(await screen.findByText("There's no customer account with that id.")).toBeInTheDocument();
    first.unmount();

    renderWithProviders(<App />, { route: "/admin/customers/user-admin-seed" });
    expect(await screen.findByText("There's no customer account with that id.")).toBeInTheDocument();
  });
});
