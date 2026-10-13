import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminAnalyticsPage } from "../../pages/admin/AdminAnalyticsPage";
import { createTestStore, renderWithProviders } from "../renderWithProviders";
import { listAllOrders, ordersApi, type PlaceOrderInput } from "../../services/api/ordersApi";
import { archiveProduct } from "../../services/catalog/productStore";
import { updateCategory } from "../../services/catalog/categoryStore";
import { products as seed } from "../../mocks/data/products";
import { categories as seedCategories } from "../../mocks/data/categories";

const product = (id: string) => seed.find((p) => p.id === id)!;
const catName = (id: string) => seedCategories.find((c) => c.id === id)!.name;
const usd2 = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(n);
const usd0 = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const line = (productId: string, quantity: number) => {
  const p = product(productId);
  return { productId: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, currency: "USD", quantity };
};
const ghostLine = (quantity: number) => ({ productId: "ghost-id", slug: "ghost", name: "Discontinued Gizmo", image: "i.jpg", price: 20, currency: "USD", quantity });
const input = (lines: PlaceOrderInput["lines"]): PlaceOrderInput => ({
  lines,
  shippingAddress: { fullName: "Jo", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" },
  deliveryOption: { id: "s", label: "S", etaDays: "5", price: 0 },
  discountPercent: 0,
  paymentSummary: { brand: "Visa", last4: "4242" },
});
async function place(lines: PlaceOrderInput["lines"]) {
  const result = await createTestStore().dispatch(ordersApi.endpoints.placeOrder.initiate(input(lines)));
  if (!("data" in result) || !result.data) throw new Error("order not placed");
  return result.data;
}

const kpiValue = (label: string) => {
  const el = screen.getAllByText(label).find((e) => e.tagName === "P");
  if (!el) throw new Error(`no KPI labelled ${label}`);
  return el.nextElementSibling as HTMLElement;
};
const list = (name: string) => screen.getByRole("list", { name });
const row = (listName: string, text: string) => within(list(listName)).getByText(text).closest("li") as HTMLElement;

// The mock order store is module-level state shared by every test in this file,
// so these tests are order-dependent by necessity: the empty state must run first.
describe("Admin analytics page", () => {
  it("shows a skeleton, then a designed empty state in EVERY view, and an honest conversion value", async () => {
    renderWithProviders(<AdminAnalyticsPage />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();

    expect(await screen.findByText("No revenue in this period yet.")).toBeInTheDocument();
    expect(screen.getByText("No orders in this period.")).toBeInTheDocument(); // orders by status
    expect(screen.getAllByText("No sales in this period.")).toHaveLength(2); // top products + categories
    expect(kpiValue("Revenue")).toHaveTextContent("$0");
    expect(kpiValue("Orders")).toHaveTextContent("0");
    // Average order and conversion are never invented.
    expect(kpiValue("Average order")).toHaveTextContent("Not available");
    expect(kpiValue("Conversion")).toHaveTextContent("Not available");
    expect(screen.getByText(/needs visit \(session\) data/i)).toBeInTheDocument();
  });

  it("renders every view from real orders: KPIs, revenue chart table, status, top products and categories", async () => {
    const a = await place([line("p2", 2), line("p1", 1)]); // counted
    const b = await place([line("p6", 1)]);
    await createTestStore().dispatch(ordersApi.endpoints.cancelOrder.initiate(b.id)); // not revenue, still an order

    renderWithProviders(<AdminAnalyticsPage />);
    await screen.findByRole("list", { name: "Orders by status" });

    // KPIs
    expect(kpiValue("Revenue")).toHaveTextContent(usd0(a.total));
    expect(kpiValue("Orders")).toHaveTextContent("2"); // the cancelled order is still an order
    expect(kpiValue("Average order")).toHaveTextContent(usd2(a.total)); // only one revenue-counting order

    // Revenue over time — drawing is decorative; the data is a real (visually hidden) table.
    const table = screen.getByRole("table", { name: "Revenue over time" });
    expect(within(table).getAllByRole("row")).toHaveLength(31); // header + 30 days
    expect(within(table).getAllByText(usd2(a.total))).toHaveLength(1);

    // Orders by status: all 8 statuses, lifecycle order, zero rows kept; cancelled orders are shown.
    const items = within(list("Orders by status")).getAllByRole("listitem");
    expect(items.map((li) => li.textContent?.replace(/\d+$/, ""))).toEqual([
      "Pending", "Confirmed", "Processing", "Shipped", "Out for delivery", "Delivered", "Cancelled", "Refunded",
    ]);
    expect(row("Orders by status", "Confirmed")).toHaveTextContent(/Confirmed\s*1/);
    expect(row("Orders by status", "Cancelled")).toHaveTextContent(/Cancelled\s*1/);
    expect(row("Orders by status", "Pending")).toHaveTextContent(/Pending\s*0/);

    // Top products: counted orders only (the cancelled p6 order is excluded), line-item sales + units.
    const p2 = product("p2");
    expect(row("Top products", p2.name)).toHaveTextContent(usd2(p2.price * 2));
    expect(row("Top products", p2.name)).toHaveTextContent("2 units");
    expect(within(list("Top products")).queryByText(product("p6").name)).not.toBeInTheDocument();

    // Sales by category: names, not ids.
    expect(row("Sales by category", catName(p2.categoryId))).toHaveTextContent("2 units");
    expect(within(list("Sales by category")).queryByText(catName(product("p6").categoryId))).not.toBeInTheDocument();

    // The basis is stated, not implied.
    expect(screen.getAllByText(/before discounts, shipping and tax/i).length).toBeGreaterThanOrEqual(2);
  });

  it("the period control re-scopes every view", async () => {
    // Place a second counted order that genuinely landed 20 days ago. Only Date is faked
    // (RTK's timers stay real), and orders returned by RTK Query are frozen, so we can't
    // edit one after the fact.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() - 20 * 86_400_000);
    const old = await place([line("p7", 1)]);
    vi.useRealTimers();

    const dayMs = 86_400_000;
    const recent = listAllOrders().filter((o) => Date.now() - new Date(o.placedAt).getTime() < 7 * dayMs);
    const recentRevenue = recent.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);

    renderWithProviders(<AdminAnalyticsPage />);
    await screen.findByRole("list", { name: "Orders by status" });
    expect(screen.getByLabelText("Period")).toHaveValue("30");
    expect(kpiValue("Orders")).toHaveTextContent("3"); // today's two + the 20-day-old one
    expect(within(list("Top products")).getByText(product("p7").name)).toBeInTheDocument();
    expect(kpiValue("Revenue")).toHaveTextContent(usd0(recentRevenue + old.total));

    await userEvent.selectOptions(screen.getByLabelText("Period"), "7");
    await waitFor(() => expect(kpiValue("Orders")).toHaveTextContent("2")); // the 20-day-old order drops out
    expect(kpiValue("Revenue")).toHaveTextContent(usd0(recentRevenue));
    expect(within(list("Top products")).queryByText(product("p7").name)).not.toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "Revenue over time" })).getAllByRole("row")).toHaveLength(8);

    await userEvent.selectOptions(screen.getByLabelText("Period"), "90");
    await waitFor(() => expect(kpiValue("Orders")).toHaveTextContent("3"));
    expect(within(list("Top products")).getByText(product("p7").name)).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "Revenue over time" })).getAllByRole("row")).toHaveLength(91);
  });

  it("ignores an invalid ?range= instead of breaking, and the dropdown agrees", async () => {
    renderWithProviders(<AdminAnalyticsPage />, { route: "/admin/analytics?range=bogus" });
    await screen.findByRole("list", { name: "Orders by status" });
    expect(screen.getByLabelText("Period")).toHaveValue("30");
    expect(within(screen.getByRole("table", { name: "Revenue over time" })).getAllByRole("row")).toHaveLength(31);
  });

  it("reads a valid ?range= from the URL", async () => {
    renderWithProviders(<AdminAnalyticsPage />, { route: "/admin/analytics?range=90" });
    await screen.findByRole("list", { name: "Orders by status" });
    expect(screen.getByLabelText("Period")).toHaveValue("90");
  });

  it("attributes an ARCHIVED product's sales to its category, and uses a renamed category's new name", async () => {
    const p2 = product("p2");
    archiveProduct("p2");
    updateCategory(p2.categoryId, { name: "Computing Hardware" });
    renderWithProviders(<AdminAnalyticsPage />, { route: "/admin/analytics?range=90" });
    await screen.findByRole("list", { name: "Sales by category" });
    expect(within(list("Sales by category")).getByText("Computing Hardware")).toBeInTheDocument();
    expect(within(list("Sales by category")).queryByText(catName(p2.categoryId))).not.toBeInTheDocument();
  });

  it("puts sales of a product that no longer exists in an 'Unknown category' row instead of dropping or crashing", async () => {
    await place([ghostLine(2)]);
    renderWithProviders(<AdminAnalyticsPage />);
    await screen.findByRole("list", { name: "Sales by category" });
    expect(row("Sales by category", "Unknown category")).toHaveTextContent(usd2(40));
    expect(row("Top products", "Discontinued Gizmo")).toHaveTextContent("2 units");
  });

  it("shows a human-readable error and recovers on retry", async () => {
    const mod = await import("../../services/api/ordersApi");
    const real = mod.listAllOrders;
    let calls = 0;
    const spy = vi.spyOn(mod, "listAllOrders").mockImplementation(() => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return real();
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(<AdminAnalyticsPage />);
    expect(await screen.findByText("We couldn't load analytics right now.")).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("list", { name: "Orders by status" })).toBeInTheDocument();
    expect(screen.queryByText("We couldn't load analytics right now.")).not.toBeInTheDocument();

    spy.mockRestore();
    consoleSpy.mockRestore();
  });
});
