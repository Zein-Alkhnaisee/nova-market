import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import { FilterPanel } from "../../components/product/FilterPanel";
import type { ProductSummary } from "../../types/product";

function makeProduct(overrides: Partial<ProductSummary>): ProductSummary {
  return {
    id: overrides.id ?? "p1",
    slug: "p",
    name: "P",
    brand: "B",
    categoryId: "electronics",
    price: 50,
    currency: "USD",
    rating: 3,
    reviewCount: 1,
    image: "i.jpg",
    inStock: true,
    ...overrides,
  };
}

const facetBaseProducts: ProductSummary[] = [
  makeProduct({ id: "p1", rating: 4.5, inStock: true }),
  makeProduct({ id: "p2", rating: 4.2, inStock: true }),
  makeProduct({ id: "p3", rating: 3.5, inStock: false }),
  makeProduct({ id: "p4", rating: 2.0, inStock: true }),
];

describe("FilterPanel — smart facet counts", () => {
  it("shows a result count next to each rating option", () => {
    renderWithProviders(
      <FilterPanel values={{}} onChange={() => {}} onClear={() => {}} facetBaseProducts={facetBaseProducts} />
    );
    // 4+: p1, p2 → 2. 3+: p1, p2, p3 → 3. 2+: all 4 → 4. 1+: all 4 → 4.
    const ratingGroup = screen.getByRole("radiogroup", { name: "Minimum rating" });
    expect(ratingGroup).toHaveTextContent("2");
    expect(ratingGroup).toHaveTextContent("3");
    expect(ratingGroup).toHaveTextContent("4");
  });

  it("shows an in-stock count reflecting only in-stock products", () => {
    renderWithProviders(
      <FilterPanel values={{}} onChange={() => {}} onClear={() => {}} facetBaseProducts={facetBaseProducts} />
    );
    // 3 of the 4 facet base products are in stock.
    expect(screen.getByText("In stock only").closest("label")).toHaveTextContent("3");
  });

  it("disables a rating option that would return zero results", () => {
    const onlyLowRated: ProductSummary[] = [makeProduct({ id: "p1", rating: 1.5 })];
    renderWithProviders(
      <FilterPanel values={{}} onChange={() => {}} onClear={() => {}} facetBaseProducts={onlyLowRated} />
    );
    // "4+" would return 0 results — its radio input should be disabled.
    const fourPlus = screen.getByRole("radio", { name: /4\+/ });
    expect(fourPlus).toBeDisabled();
  });

  it("disables the in-stock checkbox when nothing in the facet base is in stock", () => {
    const allOutOfStock: ProductSummary[] = [makeProduct({ id: "p1", inStock: false })];
    renderWithProviders(
      <FilterPanel values={{}} onChange={() => {}} onClear={() => {}} facetBaseProducts={allOutOfStock} />
    );
    expect(screen.getByRole("checkbox", { name: /in stock only/i })).toBeDisabled();
  });

  it("renders without counts (plain mode) when facetBaseProducts is omitted", () => {
    renderWithProviders(<FilterPanel values={{}} onChange={() => {}} onClear={() => {}} />);
    const fourPlus = screen.getByRole("radio", { name: /4\+/ });
    expect(fourPlus).not.toBeDisabled();
  });

  it("calling onChange with a rating updates the selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <FilterPanel
        values={{}}
        onChange={onChange}
        onClear={() => {}}
        facetBaseProducts={facetBaseProducts}
      />
    );
    await user.click(screen.getByRole("radio", { name: /3\+/ }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ minRating: 3 }));
  });
});
