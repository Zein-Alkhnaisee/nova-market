import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";

interface WishlistState {
  productIds: string[];
}

const initialState: WishlistState = { productIds: loadPersisted<string[]>("wishlist", []) };

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<string>) => {
      const idx = state.productIds.indexOf(action.payload);
      if (idx >= 0) {
        state.productIds.splice(idx, 1);
      } else {
        state.productIds.push(action.payload);
      }
    },
  },
});

export const { toggleWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

export const selectWishlistIds = (state: { wishlist: WishlistState }) => state.wishlist.productIds;
export const selectIsWishlisted = (productId: string) => (state: { wishlist: WishlistState }) =>
  state.wishlist.productIds.includes(productId);
