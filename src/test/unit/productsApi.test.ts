import { describe, expect, it, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { productsApi } from "../../services/api/productsApi";

function createTestStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

describe("productsApi", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it("filters by search query across name and brand", async () => {
    const result = await store.dispatch(productsApi.endpoints.getProducts.initiate({ q: "keyboard" }));
    expect(result.data?.every((p) => p.name.toLowerCase().includes("keyboard"))).toBe(true);
    expect(result.data?.length).toBeGreaterThan(0);
  });

  it("filters by category", async () => {
    const result = await store.dispatch(
      productsApi.endpoints.getProducts.initiate({ categoryId: "gaming" })
    );
    expect(result.data?.every((p) => p.categoryId === "gaming")).toBe(true);
  });

  it("filters by price range", async () => {
    const result = await store.dispatch(
      productsApi.endpoints.getProducts.initiate({ minPrice: 100, maxPrice: 300 })
    );
    expect(result.data?.every((p) => p.price >= 100 && p.price <= 300)).toBe(true);
  });

  it("filters by minimum rating", async () => {
    const result = await store.dispatch(productsApi.endpoints.getProducts.initiate({ minRating: 4.6 }));
    expect(result.data?.every((p) => p.rating >= 4.6)).toBe(true);
  });

  it("filters to in-stock only", async () => {
    const result = await store.dispatch(productsApi.endpoints.getProducts.initiate({ inStockOnly: true }));
    expect(result.data?.every((p) => p.inStock)).toBe(true);
  });

  it("sorts by price ascending", async () => {
    const result = await store.dispatch(productsApi.endpoints.getProducts.initiate({ sort: "price-asc" }));
    const prices = result.data?.map((p) => p.price) ?? [];
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("sorts by price descending", async () => {
    const result = await store.dispatch(productsApi.endpoints.getProducts.initiate({ sort: "price-desc" }));
    const prices = result.data?.map((p) => p.price) ?? [];
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it("returns an empty array for a query that matches nothing", async () => {
    const result = await store.dispatch(
      productsApi.endpoints.getProducts.initiate({ q: "zzz-nonexistent-zzz" })
    );
    expect(result.data).toEqual([]);
  });

  it("finds a product by slug", async () => {
    const result = await store.dispatch(
      productsApi.endpoints.getProductBySlug.initiate("pulse-mechanical-keyboard")
    );
    expect(result.data?.name).toBe("Pulse Mechanical Keyboard");
  });
});
