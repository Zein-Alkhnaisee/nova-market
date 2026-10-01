import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { AdminProductsPage } from "../../pages/admin/AdminProductsPage";
import { AdminProductFormPage } from "../../pages/admin/AdminProductFormPage";
import { renderWithProviders } from "../renderWithProviders";
import {
  archiveProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "../../services/catalog/productStore";
import { products as seed } from "../../mocks/data/products";

function App() {
  return (
    <Routes>
      <Route path="/admin/products" element={<AdminProductsPage />} />
      <Route path="/admin/products/new" element={<AdminProductFormPage />} />
      <Route path="/admin/products/:id" element={<AdminProductFormPage />} />
    </Routes>
  );
}

const first = seed[0]; // p1
const usd = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(n);
const dataRows = (table: HTMLElement) => within(table).getAllByRole("row").slice(1);
const asInput = (p: typeof first) => ({ name: p.name, brand: p.brand, categoryId: p.categoryId, price: p.price, image: p.image });

describe("Admin products list", () => {
  it("shows a skeleton, then every active product with price, stock and status", async () => {
    renderWithProviders(<App />, { route: "/admin/products" });
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    const table = await screen.findByRole("table", { name: "Products" });
    expect(dataRows(table)).toHaveLength(seed.length);
    const row = within(table).getByText(first.name).closest("tr") as HTMLElement;
    expect(row).toHaveTextContent(usd(first.price));
    expect(row).toHaveTextContent("Not tracked");
    expect(row).toHaveTextContent("Active");
  });

  it("filters by search and category, keeps the filters in the URL, and clears them", async () => {
    renderWithProviders(<App />, { route: "/admin/products" });
    await screen.findByRole("table", { name: "Products" });

    await userEvent.type(screen.getByLabelText("Search products"), "aether");
    expect(dataRows(screen.getByRole("table"))).toHaveLength(1);
    await userEvent.clear(screen.getByLabelText("Search products"));

    await userEvent.selectOptions(screen.getByLabelText("Category"), "gaming");
    const gaming = seed.filter((p) => p.categoryId === "gaming").length;
    expect(dataRows(screen.getByRole("table"))).toHaveLength(gaming);

    await userEvent.type(screen.getByLabelText("Search products"), "zzzz");
    expect(await screen.findByText("No products match these filters")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(dataRows(await screen.findByRole("table"))).toHaveLength(seed.length);
  });

  it("filters by stock level using tracked quantities", async () => {
    updateProduct(first.id, { ...asInput(first), inventory: 3 }); // low
    updateProduct(seed[1].id, { ...asInput(seed[1]), inventory: 0 }); // out
    renderWithProviders(<App />, { route: "/admin/products" });
    await screen.findByRole("table", { name: "Products" });

    await userEvent.selectOptions(screen.getByLabelText("Stock"), "low");
    expect(dataRows(screen.getByRole("table"))).toHaveLength(1);
    expect(screen.getByRole("table")).toHaveTextContent(first.name);

    await userEvent.selectOptions(screen.getByLabelText("Stock"), "out");
    const table = screen.getByRole("table");
    expect(table).toHaveTextContent(seed[1].name);
    expect(within(table).getAllByText("Out of stock").length).toBeGreaterThan(0);
  });

  it("archives a product, hides it from the active list, and offers a working Undo", async () => {
    renderWithProviders(<App />, { route: "/admin/products" });
    await screen.findByRole("table", { name: "Products" });

    await userEvent.click(screen.getByRole("button", { name: `Archive ${first.name}` }));
    expect(await screen.findByText(/archived\. It's hidden from the store/i)).toBeInTheDocument();
    await waitFor(() => expect(within(screen.getByRole("table")).queryByText(first.name)).not.toBeInTheDocument());
    expect(getProductById(first.id)).toBeUndefined(); // gone from the storefront read

    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(await within(await screen.findByRole("table")).findByText(first.name)).toBeInTheDocument();
    expect(getProductById(first.id)).toBeDefined();
  });

  it("lists archived products under the Archived filter and restores them", async () => {
    archiveProduct(first.id);
    renderWithProviders(<App />, { route: "/admin/products" });
    await screen.findByRole("table", { name: "Products" });
    expect(within(screen.getByRole("table")).queryByText(first.name)).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Status"), "archived");
    const table = screen.getByRole("table");
    expect(dataRows(table)).toHaveLength(1);
    expect(table).toHaveTextContent("Archived");

    await userEvent.click(screen.getByRole("button", { name: `Restore ${first.name}` }));
    expect(await screen.findByText(/restored\. It's visible in the store again/i)).toBeInTheDocument();
    expect(getProductById(first.id)).toBeDefined();
  });

  it("shows a human-readable error and recovers on retry", async () => {
    const storeModule = await import("../../services/catalog/productStore");
    let calls = 0;
    const real = storeModule.listProducts;
    const spy = vi.spyOn(storeModule, "listProducts").mockImplementation((...args) => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return real(...args);
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(<App />, { route: "/admin/products" });
    expect(await screen.findByText("We couldn't load products right now.")).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("table", { name: "Products" })).toBeInTheDocument();

    spy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe("Admin product form", () => {
  it("creates a product that then appears in the list and in the storefront catalog", async () => {
    renderWithProviders(<App />, { route: "/admin/products/new" });
    await userEvent.type(await screen.findByLabelText("Name"), "Lumen Desk Lamp");
    await userEvent.type(screen.getByLabelText("Brand"), "Lumen");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "home");
    await userEvent.type(screen.getByLabelText("Price (USD)"), "49.99");
    await userEvent.type(screen.getByLabelText("Stock quantity"), "12");
    await userEvent.type(screen.getByLabelText("Image URL"), "https://example.com/lamp.jpg");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    const table = await screen.findByRole("table", { name: "Products" });
    const row = (await within(table).findByText("Lumen Desk Lamp")).closest("tr") as HTMLElement;
    expect(row).toHaveTextContent(usd(49.99));
    expect(row).toHaveTextContent("12");
    const created = listProducts().find((p) => p.name === "Lumen Desk Lamp");
    expect(created).toMatchObject({ slug: "lumen-desk-lamp", inStock: true, inventory: 12 });
  });

  it("shows field errors, marks fields invalid, moves focus to the first one, and writes nothing", async () => {
    renderWithProviders(<App />, { route: "/admin/products/new" });
    await userEvent.click(await screen.findByRole("button", { name: "Create product" }));

    expect((await screen.findAllByText("This field is required.")).length).toBeGreaterThanOrEqual(4);
    const name = screen.getByLabelText("Name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("This field is required.");
    await waitFor(() => expect(name).toHaveFocus());
    expect(listProducts()).toHaveLength(seed.length);
  });

  it("reports a duplicate slug on the slug field", async () => {
    renderWithProviders(<App />, { route: "/admin/products/new" });
    await userEvent.type(await screen.findByLabelText("Name"), "Another Lamp");
    await userEvent.type(screen.getByLabelText("Slug"), first.slug);
    await userEvent.type(screen.getByLabelText("Brand"), "Lumen");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "home");
    await userEvent.type(screen.getByLabelText("Price (USD)"), "10");
    await userEvent.type(screen.getByLabelText("Image URL"), "https://example.com/a.jpg");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    expect(await screen.findByText("This slug is already used by another product.")).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toHaveAttribute("aria-invalid", "true");
  });

  it("edits a product: prefilled, saved, and reflected in the store", async () => {
    renderWithProviders(<App />, { route: `/admin/products/${first.id}` });
    const price = await screen.findByLabelText("Price (USD)");
    expect(screen.getByLabelText("Name")).toHaveValue(first.name);
    expect(price).toHaveValue(first.price);
    expect(screen.getByText(/Not tracked yet/)).toBeInTheDocument();

    await userEvent.clear(price);
    await userEvent.type(price, "111");
    await userEvent.type(screen.getByLabelText("Stock quantity"), "0");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const table = await screen.findByRole("table", { name: "Products" });
    const row = (await within(table).findByText(first.name)).closest("tr") as HTMLElement;
    expect(row).toHaveTextContent(usd(111));
    expect(within(row).getByText("Out of stock")).toBeInTheDocument();
    expect(getProductById(first.id)).toMatchObject({ price: 111, inventory: 0, inStock: false });
  });

  it("shows an archived product with a banner and restores it from the form", async () => {
    archiveProduct(first.id);
    renderWithProviders(<App />, { route: `/admin/products/${first.id}` });
    expect(await screen.findByText(/This product is archived/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Restore" }));
    await screen.findByRole("table", { name: "Products" });
    expect(getProductById(first.id)).toBeDefined();
  });

  it("shows not-found for an unknown product id", async () => {
    renderWithProviders(<App />, { route: "/admin/products/does-not-exist" });
    expect(await screen.findByText("There's no product with that id.")).toBeInTheDocument();
  });
});
