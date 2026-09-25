import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, createTestStore } from "../renderWithProviders";
import { addToCart } from "../../features/cart/cartSlice";
import { setFeatureFlag } from "../../features/settings/featureFlagsSlice";
import { CartPage } from "../../pages/cart/CartPage";
import type { ProductSummary } from "../../types/product";

const keyboard: ProductSummary = {
  id: "p3",
  slug: "pulse-mechanical-keyboard",
  name: "Pulse Mechanical Keyboard",
  brand: "Pulse",
  categoryId: "computers",
  price: 129,
  currency: "USD",
  rating: 4.5,
  reviewCount: 843,
  image: "https://example.com/img.jpg",
  inStock: true,
};

describe("CartPage — smart cart suggestions", () => {
  it("shows a suggestions rail sourced from items in the same category", async () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product: keyboard }));
    renderWithProviders(<CartPage />, { route: "/cart", store });

    await waitFor(() => {
      expect(screen.getByText("Complete your order")).toBeInTheDocument();
    });
    // p2 (Kite laptop) shares the "computers" category with the keyboard.
    await waitFor(() => {
      expect(screen.getByText("Kite 13 Ultralight Laptop")).toBeInTheDocument();
    });
  });

  it("hides the suggestions rail when smartRecommendations is disabled", async () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product: keyboard }));
    store.dispatch(setFeatureFlag({ key: "smartRecommendations", enabled: false }));
    renderWithProviders(<CartPage />, { route: "/cart", store });

    await waitFor(() => expect(screen.getByText("Your cart")).toBeInTheDocument());
    expect(screen.queryByText("Complete your order")).not.toBeInTheDocument();
  });
});
