import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminDashboardPage } from "../../pages/admin/AdminDashboardPage";
import { createTestStore, renderWithProviders } from "../renderWithProviders";
import { ordersApi } from "../../services/api/ordersApi";
import { products } from "../../mocks/data/products";
import { archiveProduct } from "../../services/catalog/productStore";

// The mock order store is module-level state shared by every test in this
// file, so the empty-state test must run before anything places an order.
describe("AdminDashboardPage", () => {
  it("shows a skeleton, then designed empty states and an honest conversion value with no orders", async () => {
    renderWithProviders(<AdminDashboardPage />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();

    expect(await screen.findByText("No orders yet")).toBeInTheDocument();
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(screen.getByText("No revenue in this period yet.")).toBeInTheDocument();
    // Conversion is never invented: the card says it is unavailable and why.
    expect(screen.getByText("Not available")).toBeInTheDocument();
    expect(screen.getByText(/needs visit \(session\) data/i)).toBeInTheDocument();
    expect(screen.getByText(String(products.length))).toBeInTheDocument();
  });

  it("reflects a placed order in KPIs, top products, the revenue table and recent orders", async () => {
    const store = createTestStore();
    await store.dispatch(
      ordersApi.endpoints.placeOrder.initiate({
        lines: [{ productId: "p-x", slug: "p-x", name: "Aurora Desk Lamp", image: "i.jpg", price: 80, currency: "USD", quantity: 2 }],
        shippingAddress: { fullName: "Dana Whitfield", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+1 415 555 0100" },
        deliveryOption: { id: "s", label: "Standard", etaDays: "5 business days", price: 0 },
        discountPercent: 0,
        paymentSummary: { brand: "Visa", last4: "4242" },
      })
    );

    renderWithProviders(<AdminDashboardPage />, { store });

    // Appears in both Top products and Recent orders' customer column.
    expect(await screen.findByText("Aurora Desk Lamp")).toBeInTheDocument();
    expect(screen.getByText("Dana Whitfield")).toBeInTheDocument();
    expect(screen.queryByText("No orders yet")).not.toBeInTheDocument();
    expect(screen.getByText("2 units")).toBeInTheDocument();

    const revenueTable = screen.getByRole("table", { name: "Revenue" });
    expect(within(revenueTable).getAllByRole("row").length).toBeGreaterThan(1);
    const recent = screen.getByRole("heading", { name: "Recent orders" }).closest("div") as HTMLElement;
    expect(within(recent).getByText("Confirmed")).toBeInTheDocument();
  });

  it("shows a human-readable error state and recovers when the person retries", async () => {
    const ordersModule = await import("../../services/api/ordersApi");
    const realList = ordersModule.listAllOrders;
    let calls = 0;
    const spy = vi.spyOn(ordersModule, "listAllOrders").mockImplementation(() => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return realList();
    });
    // RTK Query logs unhandled queryFn errors; that's expected noise here.
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(<AdminDashboardPage />);
    expect(await screen.findByText("We couldn't load the dashboard right now.")).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("heading", { name: "Recent orders" })).toBeInTheDocument();
    expect(screen.queryByText("We couldn't load the dashboard right now.")).not.toBeInTheDocument();

    spy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("counts products from the shared catalog store, so archiving one lowers the count", async () => {
    archiveProduct(products[0].id);
    renderWithProviders(<AdminDashboardPage />);
    const label = await screen.findByText("Products");
    expect(label.nextElementSibling).toHaveTextContent(String(products.length - 1));
  });
});
