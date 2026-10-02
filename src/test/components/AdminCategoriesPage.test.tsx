import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminCategoriesPage } from "../../pages/admin/AdminCategoriesPage";
import { renderWithProviders } from "../renderWithProviders";
import { getCategoryById, listCategories } from "../../services/catalog/categoryStore";
import { archiveProduct } from "../../services/catalog/productStore";
import { categories as seed } from "../../mocks/data/categories";
import { products as seedProducts } from "../../mocks/data/products";

const emptyCat = seed.find((c) => !seedProducts.some((p) => p.categoryId === c.id))!;
const usedCat = seed.find((c) => seedProducts.some((p) => p.categoryId === c.id))!;
const dataRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);
const rowFor = (name: string) => within(screen.getByRole("table")).getByText(name).closest("tr") as HTMLElement;

describe("Admin categories page", () => {
  it("shows a skeleton, then every category with its slug and product counts", async () => {
    renderWithProviders(<AdminCategoriesPage />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    await screen.findByRole("table", { name: "Categories" });
    expect(dataRows()).toHaveLength(seed.length);
    const used = seedProducts.filter((p) => p.categoryId === usedCat.id).length;
    expect(rowFor(usedCat.name)).toHaveTextContent(usedCat.slug);
    expect(within(rowFor(usedCat.name)).getAllByRole("cell")[1]).toHaveTextContent(String(used));
  });

  it("creates a category through the form and lists it", async () => {
    renderWithProviders(<AdminCategoriesPage />);
    await screen.findByRole("table", { name: "Categories" });
    await userEvent.click(screen.getByRole("button", { name: "New category" }));
    await userEvent.type(screen.getByLabelText("Name"), "Gardening");
    await userEvent.click(screen.getByRole("button", { name: "Create category" }));

    expect(await screen.findByText("“Gardening” created.")).toBeInTheDocument();
    expect(await within(await screen.findByRole("table")).findByText("Gardening")).toBeInTheDocument();
    expect(getCategoryById("gardening")).toMatchObject({ id: "gardening", slug: "gardening" });
  });

  it("shows field errors with aria wiring and focus, and writes nothing", async () => {
    renderWithProviders(<AdminCategoriesPage />);
    await screen.findByRole("table", { name: "Categories" });
    await userEvent.click(screen.getByRole("button", { name: "New category" }));
    await userEvent.click(screen.getByRole("button", { name: "Create category" }));

    const name = await screen.findByLabelText("Name");
    await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"));
    expect(name).toHaveAccessibleDescription("This field is required.");
    await waitFor(() => expect(name).toHaveFocus());
    expect(listCategories()).toHaveLength(seed.length);
  });

  it("reports a duplicate name on the name field", async () => {
    renderWithProviders(<AdminCategoriesPage />);
    await screen.findByRole("table", { name: "Categories" });
    await userEvent.click(screen.getByRole("button", { name: "New category" }));
    await userEvent.type(screen.getByLabelText("Name"), usedCat.name.toLowerCase());
    await userEvent.click(screen.getByRole("button", { name: "Create category" }));
    expect(await screen.findByText("This is already used by another category.")).toBeInTheDocument();
  });

  it("edits a name, and shows the slug as fixed (read-only), not as an input", async () => {
    renderWithProviders(<AdminCategoriesPage />);
    await screen.findByRole("table", { name: "Categories" });
    await userEvent.click(screen.getByRole("button", { name: `Edit ${usedCat.name}` }));

    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
    expect(screen.getByText(/can't be changed after creation/i)).toBeInTheDocument();

    const name = screen.getByLabelText("Name");
    expect(name).toHaveValue(usedCat.name);
    await userEvent.clear(name);
    await userEvent.type(name, "Renamed Category");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("“Renamed Category” updated.")).toBeInTheDocument();
    expect(getCategoryById(usedCat.id)).toMatchObject({ name: "Renamed Category", slug: usedCat.slug });
  });

  it("disables Delete for a category with products and explains why (archived products count too)", async () => {
    seedProducts.filter((p) => p.categoryId === usedCat.id).forEach((p) => archiveProduct(p.id));
    renderWithProviders(<AdminCategoriesPage />);
    await screen.findByRole("table", { name: "Categories" });

    const del = screen.getByRole("button", { name: `Delete ${usedCat.name}` });
    expect(del).toBeDisabled();
    expect(del).toHaveAccessibleDescription(/can't delete while it still has \d+ products? \(archived products count\)/i);
    expect(rowFor(usedCat.name)).toHaveTextContent(/archived/i);
  });

  it("deletes an empty category only after confirmation, defaulting focus to the safe choice", async () => {
    renderWithProviders(<AdminCategoriesPage />);
    await screen.findByRole("table", { name: "Categories" });

    await userEvent.click(screen.getByRole("button", { name: `Delete ${emptyCat.name}` }));
    const dialog = screen.getByRole("alertdialog", { name: `Delete “${emptyCat.name}”?` });
    expect(within(dialog).getByRole("button", { name: "Keep it" })).toHaveFocus();
    expect(getCategoryById(emptyCat.id)).toBeDefined(); // nothing happens until confirmed

    await userEvent.click(within(dialog).getByRole("button", { name: "Keep it" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(getCategoryById(emptyCat.id)).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: `Delete ${emptyCat.name}` }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete category" }));
    expect(await screen.findByText(`“${emptyCat.name}” deleted.`)).toBeInTheDocument();
    expect(getCategoryById(emptyCat.id)).toBeUndefined();
    await waitFor(() => expect(within(screen.getByRole("table")).queryByText(emptyCat.name)).not.toBeInTheDocument());
  });

  it("shows the 409 message if products arrive between loading the list and confirming delete", async () => {
    renderWithProviders(<AdminCategoriesPage />);
    await screen.findByRole("table", { name: "Categories" });
    await userEvent.click(screen.getByRole("button", { name: `Delete ${emptyCat.name}` }));

    // A product lands in the category after the page has already loaded.
    const { createProduct } = await import("../../services/catalog/productStore");
    createProduct({ name: "Late Arrival", brand: "B", categoryId: emptyCat.id, price: 5, image: "https://example.com/x.jpg" });

    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete category" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/wasn't deleted: it still has 1 product/i);
    expect(getCategoryById(emptyCat.id)).toBeDefined();
  });

  it("shows a human-readable error and recovers on retry", async () => {
    const mod = await import("../../services/catalog/categoryStore");
    const real = mod.listCategories;
    let calls = 0;
    const spy = vi.spyOn(mod, "listCategories").mockImplementation(() => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return real();
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(<AdminCategoriesPage />);
    expect(await screen.findByText("We couldn't load categories right now.")).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("table", { name: "Categories" })).toBeInTheDocument();

    spy.mockRestore();
    consoleSpy.mockRestore();
  });
});
