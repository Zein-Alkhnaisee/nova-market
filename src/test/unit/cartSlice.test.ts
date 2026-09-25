import { describe, expect, it } from "vitest";
import cartReducer, {
  addToCart,
  removeFromCart,
  setQuantity,
  clearCart,
  selectCartCount,
  selectCartSubtotal,
} from "../../features/cart/cartSlice";
import type { ProductSummary } from "../../types/product";

const product: ProductSummary = {
  id: "p1",
  slug: "test-product",
  name: "Test Product",
  brand: "Test Brand",
  categoryId: "electronics",
  price: 50,
  currency: "USD",
  rating: 4.5,
  reviewCount: 10,
  image: "https://example.com/image.jpg",
  inStock: true,
};

describe("cartSlice", () => {
  it("adds a new product with quantity 1 by default", () => {
    const state = cartReducer(undefined, addToCart({ product }));
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0]).toMatchObject({ productId: "p1", quantity: 1 });
  });

  it("increments quantity when adding an already-present product", () => {
    let state = cartReducer(undefined, addToCart({ product }));
    state = cartReducer(state, addToCart({ product, quantity: 2 }));
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].quantity).toBe(3);
  });

  it("removes a line item", () => {
    let state = cartReducer(undefined, addToCart({ product }));
    state = cartReducer(state, removeFromCart({ productId: "p1" }));
    expect(state.lines).toHaveLength(0);
  });

  it("never allows quantity below 1", () => {
    let state = cartReducer(undefined, addToCart({ product }));
    state = cartReducer(state, setQuantity({ productId: "p1", quantity: 0 }));
    expect(state.lines[0].quantity).toBe(1);
  });

  it("clears all lines", () => {
    let state = cartReducer(undefined, addToCart({ product }));
    state = cartReducer(state, clearCart());
    expect(state.lines).toHaveLength(0);
  });

  it("selectCartCount sums quantities across lines", () => {
    let state = cartReducer(undefined, addToCart({ product, quantity: 2 }));
    state = cartReducer(
      state,
      addToCart({ product: { ...product, id: "p2" }, quantity: 3 })
    );
    expect(selectCartCount({ cart: state })).toBe(5);
  });

  it("selectCartSubtotal multiplies price by quantity across lines", () => {
    const state = cartReducer(undefined, addToCart({ product, quantity: 3 }));
    expect(selectCartSubtotal({ cart: state })).toBe(150);
  });
});
