import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartLine } from "../../types/cart";
import type { ProductSummary } from "../../types/product";
import { loadPersisted } from "../../lib/persist";

interface CartState {
  lines: CartLine[];
}

const initialState: CartState = { lines: loadPersisted<CartLine[]>("cart", []) };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{
        product: ProductSummary;
        quantity?: number;
        /** A configured price (base + selected option deltas), if this add comes from the Product Configurator. */
        overridePrice?: number;
        configurationSummary?: string;
      }>
    ) => {
      const { product, quantity = 1, overridePrice, configurationSummary } = action.payload;
      // A configured line (e.g. "32GB / 1TB / K2 Pro") is a distinct purchasable
      // item from the base product, so it only merges with an existing line that
      // has the exact same configuration — never silently combined with, or
      // silently overwriting, a differently-configured line of the same product.
      const existing = state.lines.find(
        (line) => line.productId === product.id && line.configurationSummary === configurationSummary
      );
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.lines.push({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: overridePrice ?? product.price,
          currency: product.currency,
          quantity,
          configurationSummary,
        });
      }
    },
    removeFromCart: (state, action: PayloadAction<{ productId: string; configurationSummary?: string }>) => {
      state.lines = state.lines.filter(
        (line) =>
          !(
            line.productId === action.payload.productId &&
            line.configurationSummary === action.payload.configurationSummary
          )
      );
    },
    setQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number; configurationSummary?: string }>
    ) => {
      const line = state.lines.find(
        (l) =>
          l.productId === action.payload.productId &&
          l.configurationSummary === action.payload.configurationSummary
      );
      if (line) line.quantity = Math.max(1, action.payload.quantity);
    },
    clearCart: (state) => {
      state.lines = [];
    },
  },
});

export const { addToCart, removeFromCart, setQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartLines = (state: { cart: CartState }) => state.cart.lines;
export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.lines.reduce((sum, line) => sum + line.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
