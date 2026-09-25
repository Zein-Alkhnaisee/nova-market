import { describe, expect, it } from "vitest";
import cartReducer, {
  addToCart,
  removeFromCart,
  setQuantity,
  selectCartSubtotal,
} from "../../features/cart/cartSlice";
import type { ProductSummary } from "../../types/product";

const configurableProduct: ProductSummary = {
  id: "p2",
  slug: "kite-13-ultralight-laptop",
  name: "Kite 13 Ultralight Laptop",
  brand: "Kite",
  categoryId: "computers",
  price: 1399,
  currency: "USD",
  rating: 4.6,
  reviewCount: 512,
  image: "https://example.com/img.jpg",
  inStock: true,
};

describe("cartSlice — configured products", () => {
  it("stores the configured (overridden) price, not the base price", () => {
    const state = cartReducer(
      undefined,
      addToCart({
        product: configurableProduct,
        overridePrice: 1899,
        configurationSummary: "32GB unified / 1TB SSD / Kite Silicon K2 Pro",
      })
    );
    expect(state.lines[0].price).toBe(1899);
    expect(state.lines[0].configurationSummary).toBe("32GB unified / 1TB SSD / Kite Silicon K2 Pro");
  });

  it("keeps two different configurations of the same product as separate lines", () => {
    let state = cartReducer(
      undefined,
      addToCart({ product: configurableProduct, overridePrice: 1399, configurationSummary: "Base config" })
    );
    state = cartReducer(
      state,
      addToCart({ product: configurableProduct, overridePrice: 1899, configurationSummary: "Upgraded config" })
    );
    expect(state.lines).toHaveLength(2);
  });

  it("merges quantity when adding the exact same configuration twice", () => {
    let state = cartReducer(
      undefined,
      addToCart({ product: configurableProduct, overridePrice: 1899, configurationSummary: "Upgraded config" })
    );
    state = cartReducer(
      state,
      addToCart({ product: configurableProduct, overridePrice: 1899, configurationSummary: "Upgraded config" })
    );
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].quantity).toBe(2);
  });

  it("an unconfigured add and a configured add of the same product stay separate", () => {
    let state = cartReducer(undefined, addToCart({ product: configurableProduct }));
    state = cartReducer(
      state,
      addToCart({ product: configurableProduct, overridePrice: 1899, configurationSummary: "Upgraded config" })
    );
    expect(state.lines).toHaveLength(2);
  });

  it("removing one configuration doesn't remove a different configuration of the same product", () => {
    let state = cartReducer(
      undefined,
      addToCart({ product: configurableProduct, overridePrice: 1399, configurationSummary: "Base config" })
    );
    state = cartReducer(
      state,
      addToCart({ product: configurableProduct, overridePrice: 1899, configurationSummary: "Upgraded config" })
    );
    state = cartReducer(
      state,
      removeFromCart({ productId: configurableProduct.id, configurationSummary: "Base config" })
    );
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].configurationSummary).toBe("Upgraded config");
  });

  it("changing quantity on one configuration doesn't affect a sibling configuration", () => {
    let state = cartReducer(
      undefined,
      addToCart({ product: configurableProduct, overridePrice: 1399, configurationSummary: "Base config" })
    );
    state = cartReducer(
      state,
      addToCart({ product: configurableProduct, overridePrice: 1899, configurationSummary: "Upgraded config" })
    );
    state = cartReducer(
      state,
      setQuantity({ productId: configurableProduct.id, quantity: 5, configurationSummary: "Base config" })
    );
    const base = state.lines.find((l) => l.configurationSummary === "Base config");
    const upgraded = state.lines.find((l) => l.configurationSummary === "Upgraded config");
    expect(base?.quantity).toBe(5);
    expect(upgraded?.quantity).toBe(1);
  });

  it("subtotal sums configured-line prices correctly across mixed lines", () => {
    let state = cartReducer(
      undefined,
      addToCart({ product: configurableProduct, overridePrice: 1899, configurationSummary: "Upgraded config" })
    );
    state = cartReducer(state, addToCart({ product: { ...configurableProduct, id: "p1" }, quantity: 2 }));
    // 1899 (configured, qty 1) + 1399*2 (unconfigured, qty 2) = 4697
    expect(selectCartSubtotal({ cart: state })).toBe(1899 + 1399 * 2);
  });
});
