import { describe, expect, it } from "vitest";
import wishlistReducer, {
  toggleWishlist,
  selectIsWishlisted,
} from "../../features/wishlist/wishlistSlice";

describe("wishlistSlice", () => {
  it("adds a product id on first toggle", () => {
    const state = wishlistReducer(undefined, toggleWishlist("p1"));
    expect(state.productIds).toEqual(["p1"]);
  });

  it("removes a product id on second toggle", () => {
    let state = wishlistReducer(undefined, toggleWishlist("p1"));
    state = wishlistReducer(state, toggleWishlist("p1"));
    expect(state.productIds).toEqual([]);
  });

  it("selectIsWishlisted reflects current state", () => {
    const state = wishlistReducer(undefined, toggleWishlist("p1"));
    expect(selectIsWishlisted("p1")({ wishlist: state })).toBe(true);
    expect(selectIsWishlisted("p2")({ wishlist: state })).toBe(false);
  });
});
