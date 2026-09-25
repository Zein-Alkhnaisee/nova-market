import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, createTestStore } from "../renderWithProviders";
import { setFeatureFlag } from "../../features/settings/featureFlagsSlice";
import { toggleCompare } from "../../features/compare/compareSlice";
import { ProductCard } from "../../components/product/ProductCard";
import { CompareBar } from "../../components/layout/CompareBar";
import type { ProductSummary } from "../../types/product";

const product: ProductSummary = {
  id: "p1",
  slug: "test-product",
  name: "Test Product",
  brand: "Test Brand",
  categoryId: "electronics",
  price: 99,
  currency: "USD",
  rating: 4.5,
  reviewCount: 12,
  image: "https://example.com/image.jpg",
  inStock: true,
};

describe("productComparison feature flag gating", () => {
  it("shows the compare button on ProductCard by default", () => {
    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByRole("button", { name: /add to compare/i })).toBeInTheDocument();
  });

  it("hides the compare button when productComparison is disabled", () => {
    const store = createTestStore();
    store.dispatch(setFeatureFlag({ key: "productComparison", enabled: false }));
    renderWithProviders(<ProductCard product={product} />, { store });
    expect(screen.queryByRole("button", { name: /add to compare/i })).not.toBeInTheDocument();
  });

  it("shows the CompareBar when items are selected and the flag is on", async () => {
    const store = createTestStore();
    store.dispatch(toggleCompare("p1"));
    renderWithProviders(<CompareBar />, { store });
    await waitFor(() => expect(screen.getAllByText("Compare products").length).toBeGreaterThan(0));
  });

  it("hides the CompareBar even with items selected when the flag is off", () => {
    const store = createTestStore();
    store.dispatch(toggleCompare("p1"));
    store.dispatch(setFeatureFlag({ key: "productComparison", enabled: false }));
    renderWithProviders(<CompareBar />, { store });
    expect(screen.queryAllByText("Compare products")).toHaveLength(0);
  });
});
