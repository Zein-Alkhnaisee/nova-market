import { describe, expect, it } from "vitest";
import recentlyViewedReducer, {
  recordProductView,
  clearRecentlyViewed,
} from "../../features/products/recentlyViewedSlice";

describe("recentlyViewedSlice", () => {
  it("records a viewed product to the front", () => {
    const state = recentlyViewedReducer(undefined, recordProductView("p1"));
    expect(state.productIds).toEqual(["p1"]);
  });

  it("moves a re-viewed product to the front instead of duplicating it", () => {
    let state = recentlyViewedReducer(undefined, recordProductView("p1"));
    state = recentlyViewedReducer(state, recordProductView("p2"));
    state = recentlyViewedReducer(state, recordProductView("p1"));
    expect(state.productIds).toEqual(["p1", "p2"]);
  });

  it("caps the list at 12 products", () => {
    let state = recentlyViewedReducer(undefined, { type: "init" } as never);
    for (let i = 0; i < 15; i++) {
      state = recentlyViewedReducer(state, recordProductView(`p${i}`));
    }
    expect(state.productIds).toHaveLength(12);
    expect(state.productIds[0]).toBe("p14");
  });

  it("clears all viewed products", () => {
    let state = recentlyViewedReducer(undefined, recordProductView("p1"));
    state = recentlyViewedReducer(state, clearRecentlyViewed());
    expect(state.productIds).toEqual([]);
  });
});
