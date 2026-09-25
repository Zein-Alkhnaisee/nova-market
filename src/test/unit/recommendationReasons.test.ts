import { describe, expect, it, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { recommendationsApi } from "../../services/api/recommendationsApi";

function createTestStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

describe("recommendationsApi — reasons (MASTER_SPEC §89)", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it("every related product includes a non-empty reason", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getRelatedProducts.initiate({ productId: "p2" })
    );
    expect(result.data?.length).toBeGreaterThan(0);
    expect(result.data?.every((p) => typeof p.reason === "string" && p.reason.length > 0)).toBe(true);
  });

  it("same-category related products get a category-specific reason", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getRelatedProducts.initiate({ productId: "p2", limit: 1 })
    );
    expect(result.data?.[0]?.reason).toMatch(/popular with/i);
  });

  it("personalized picks matching an interest category say so", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getPersonalizedProducts.initiate({ categoryIds: ["computers"], limit: 2 })
    );
    // "computers" has exactly 2 products (p2, p3), so limiting to 2 avoids
    // the trending backfill and keeps this assertion about category-match
    // reasoning specifically.
    expect(result.data).toHaveLength(2);
    expect(result.data?.every((p) => p.reason === "Matches your recent interests")).toBe(true);
  });

  it("personalized fallback (no interests) is reasoned as trending, not silently unlabeled", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getPersonalizedProducts.initiate({ categoryIds: [] })
    );
    expect(result.data?.every((p) => p.reason === "Trending right now")).toBe(true);
  });

  it("cart suggestions exclude items already in the cart", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getCartSuggestions.initiate({ cartProductIds: ["p2", "p3"] })
    );
    expect(result.data?.some((p) => p.id === "p2" || p.id === "p3")).toBe(false);
  });

  it("cart suggestions reason as 'Complete your setup' when a configurable product is in the cart", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getCartSuggestions.initiate({ cartProductIds: ["p2"] })
    );
    expect(result.data?.every((p) => p.reason === "Complete your setup")).toBe(true);
  });

  it("cart suggestions reason as 'Frequently bought with this item' otherwise", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getCartSuggestions.initiate({ cartProductIds: ["p1"] })
    );
    expect(result.data?.every((p) => p.reason === "Frequently bought with this item")).toBe(true);
  });

  it("cart suggestions return nothing for an empty cart", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getCartSuggestions.initiate({ cartProductIds: [] })
    );
    expect(result.data).toEqual([]);
  });
});
