import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../renderWithProviders";
import { ProductCard } from "../../components/product/ProductCard";
import { selectCartCount } from "../../features/cart/cartSlice";
import { selectIsWishlisted } from "../../features/wishlist/wishlistSlice";
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

describe("ProductCard", () => {
  it("renders name, brand and price", () => {
    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Test Brand")).toBeInTheDocument();
  });

  it("dispatches addToCart when the add-to-cart button is clicked", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ProductCard product={product} />);
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(selectCartCount(store.getState())).toBe(1);
  });

  it("toggles wishlist state when the heart button is clicked", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ProductCard product={product} />);
    const wishlistButton = screen.getByRole("button", { name: /wishlist/i });
    expect(selectIsWishlisted(product.id)(store.getState())).toBe(false);
    await user.click(wishlistButton);
    expect(selectIsWishlisted(product.id)(store.getState())).toBe(true);
    await user.click(wishlistButton);
    expect(selectIsWishlisted(product.id)(store.getState())).toBe(false);
  });

  it("disables add-to-cart and shows an out-of-stock indicator when unavailable", () => {
    renderWithProviders(<ProductCard product={{ ...product, inStock: false }} />);
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeDisabled();
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });
});
