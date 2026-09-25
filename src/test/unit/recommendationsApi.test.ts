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

describe("recommendationsApi", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it("excludes the source product from its own related list", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getRelatedProducts.initiate({ productId: "p2" })
    );
    expect(result.data?.some((p) => p.id === "p2")).toBe(false);
  });

  it("prefers same-category products for related items", async () => {
    // p2 and p3 are both "computers" — related for p2 should surface p3 first.
    const result = await store.dispatch(
      recommendationsApi.endpoints.getRelatedProducts.initiate({ productId: "p2", limit: 1 })
    );
    expect(result.data?.[0]?.categoryId).toBe("computers");
  });

  it("backfills related products when the category is thin", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getRelatedProducts.initiate({ productId: "p6", limit: 4 })
    );
    expect(result.data?.length).toBe(4);
  });

  it("personalized picks respect the excludeIds list", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getPersonalizedProducts.initiate({
        categoryIds: ["computers"],
        excludeIds: ["p2", "p3"],
      })
    );
    expect(result.data?.some((p) => p.id === "p2" || p.id === "p3")).toBe(false);
  });

  it("falls back to trending items when there are no category interests", async () => {
    const result = await store.dispatch(
      recommendationsApi.endpoints.getPersonalizedProducts.initiate({ categoryIds: [] })
    );
    expect(result.data?.length).toBeGreaterThan(0);
  });
});
