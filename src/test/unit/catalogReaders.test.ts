import { beforeEach, describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { productsApi } from "../../services/api/productsApi";
import { searchApi } from "../../services/api/searchApi";
import { recommendationsApi } from "../../services/api/recommendationsApi";
import { adminApi } from "../../services/api/adminApi";
import { mockAIProvider } from "../../services/assistant/mockAIProvider";
import { archiveProduct, getProductById, resetStore } from "../../services/catalog/productStore";
import { products as seed } from "../../mocks/data/products";

function createStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

const HEADPHONES = seed[0]; // p1 — "Aether Noise-Cancelling Headphones"
// Two products that share a category, so category-based recommendations have something to pick from.
const pairCategory = seed.find((a) => seed.filter((b) => b.categoryId === a.categoryId).length >= 2)!.categoryId;
const [ANCHOR, sameCategory] = seed.filter((p) => p.categoryId === pairCategory);

describe("storefront readers all see the same catalog (single store, one archive filter)", () => {
  beforeEach(() => resetStore());

  it("productsApi list and detail hide an archived product", async () => {
    archiveProduct(HEADPHONES.id);
    const store = createStore();
    const list = await store.dispatch(productsApi.endpoints.getProducts.initiate());
    expect(list.data?.some((p) => p.id === HEADPHONES.id)).toBe(false);
    expect(list.data).toHaveLength(seed.length - 1);
    const detail = await store.dispatch(productsApi.endpoints.getProductBySlug.initiate(HEADPHONES.slug));
    expect(detail.data).toBeUndefined();
  });

  it("search suggestions hide an archived product", async () => {
    const store = createStore();
    const before = await store.dispatch(searchApi.endpoints.getSearchSuggestions.initiate(HEADPHONES.name.split(" ")[0]));
    expect(before.data?.products.some((p) => p.id === HEADPHONES.id)).toBe(true);
    archiveProduct(HEADPHONES.id);
    const after = await createStore().dispatch(searchApi.endpoints.getSearchSuggestions.initiate(HEADPHONES.name.split(" ")[0]));
    expect(after.data?.products.some((p) => p.id === HEADPHONES.id)).toBe(false);
  });

  it("recommendations (related, personalized, cart suggestions) never surface an archived product", async () => {
    // Control: before archiving, the same-category product IS recommended, so the assertions below can actually fail.
    const control = await createStore().dispatch(
      recommendationsApi.endpoints.getRelatedProducts.initiate({ productId: ANCHOR.id, limit: 20 })
    );
    expect(control.data?.some((p) => p.id === sameCategory.id)).toBe(true);

    archiveProduct(sameCategory.id);
    const store = createStore(); // fresh cache
    const related = await store.dispatch(recommendationsApi.endpoints.getRelatedProducts.initiate({ productId: ANCHOR.id, limit: 20 }));
    const personalized = await store.dispatch(
      recommendationsApi.endpoints.getPersonalizedProducts.initiate({ categoryIds: [pairCategory], limit: 20 })
    );
    const cart = await store.dispatch(
      recommendationsApi.endpoints.getCartSuggestions.initiate({ cartProductIds: [ANCHOR.id], limit: 20 })
    );
    for (const result of [related, personalized, cart]) {
      expect(result.data?.some((p) => p.id === sameCategory.id)).toBe(false);
    }
  });

  it("an archived product as the related-products source yields nothing rather than an error", async () => {
    archiveProduct(HEADPHONES.id);
    const related = await createStore().dispatch(recommendationsApi.endpoints.getRelatedProducts.initiate({ productId: HEADPHONES.id }));
    expect(related.data).toEqual([]);
  });

  it("the assistant still returns products, and never an archived one", async () => {
    const ask = "tell me about the aether headphones";
    const before = await mockAIProvider.sendMessage([], ask);
    expect(before.role).toBe("assistant");
    expect(before.products?.length).toBeGreaterThan(0);
    expect(before.products?.some((p) => p.id === HEADPHONES.id)).toBe(true);

    archiveProduct(HEADPHONES.id);
    const after = await mockAIProvider.sendMessage([], ask);
    expect(after.products?.some((p) => p.id === HEADPHONES.id) ?? false).toBe(false);

    // A budget/category request is served from the same store, so it keeps working.
    const budget = await mockAIProvider.sendMessage([], "find me something under $500");
    expect(budget.products?.length).toBeGreaterThan(0);
  });
});

describe("admin writes reach the storefront through tag invalidation", () => {
  beforeEach(() => resetStore());

  it("an admin price edit refreshes a mounted storefront product list", async () => {
    const store = createStore();
    const subscription = store.dispatch(productsApi.endpoints.getProducts.initiate());
    const first = await subscription;
    expect(first.data?.find((p) => p.id === HEADPHONES.id)?.price).toBe(HEADPHONES.price);

    const result = await store.dispatch(
      adminApi.endpoints.updateAdminProduct.initiate({
        id: HEADPHONES.id,
        input: { name: HEADPHONES.name, brand: HEADPHONES.brand, categoryId: HEADPHONES.categoryId, price: 123, image: HEADPHONES.image },
      })
    );
    expect("data" in result && result.data?.ok).toBe(true);

    await expectPoll(() => {
      const current = productsApi.endpoints.getProducts.select()(store.getState()).data;
      return current?.find((p) => p.id === HEADPHONES.id)?.price === 123;
    });
    subscription.unsubscribe();
  });

  it("archiving through the admin API removes the product from a mounted storefront list", async () => {
    const store = createStore();
    const subscription = store.dispatch(productsApi.endpoints.getProducts.initiate());
    await subscription;
    await store.dispatch(adminApi.endpoints.setAdminProductArchived.initiate({ id: HEADPHONES.id, archived: true }));
    await expectPoll(() => {
      const current = productsApi.endpoints.getProducts.select()(store.getState()).data;
      return current !== undefined && !current.some((p) => p.id === HEADPHONES.id);
    });
    expect(getProductById(HEADPHONES.id)).toBeUndefined();
    subscription.unsubscribe();
  });

  it("a failed (invalid) write changes nothing and invalidates nothing", async () => {
    const store = createStore();
    const result = await store.dispatch(
      adminApi.endpoints.updateAdminProduct.initiate({
        id: HEADPHONES.id,
        input: { name: "", brand: "", categoryId: "nope", price: -1, image: "" },
      })
    );
    expect("data" in result && result.data && !result.data.ok).toBe(true);
    expect(getProductById(HEADPHONES.id)?.name).toBe(HEADPHONES.name);
  });
});

async function expectPoll(check: () => boolean, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("condition not met in time");
}
