import { beforeEach, describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { categoriesApi } from "../../services/api/categoriesApi";
import { productsApi } from "../../services/api/productsApi";
import { searchApi } from "../../services/api/searchApi";
import { recommendationsApi } from "../../services/api/recommendationsApi";
import { adminApi } from "../../services/api/adminApi";
import { mockAIProvider } from "../../services/assistant/mockAIProvider";
import { createCategory, resetStore as resetCategories, updateCategory } from "../../services/catalog/categoryStore";
import { createProduct, resetStore as resetProducts } from "../../services/catalog/productStore";
import { products as seed } from "../../mocks/data/products";

function createStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

async function poll(check: () => boolean, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("condition not met in time");
}

const product = { name: "Trowel", brand: "Spade", price: 12, image: "https://example.com/t.jpg" };

describe("storefront readers see the shared category store", () => {
  beforeEach(() => {
    resetCategories();
    resetProducts();
  });

  it("categoriesApi lists a newly created category and a renamed one", async () => {
    createCategory({ name: "Gardening" });
    updateCategory("pets", { name: "Pets & Animals" });
    const list = await createStore().dispatch(categoriesApi.endpoints.getCategories.initiate());
    expect(list.data?.some((c) => c.slug === "gardening")).toBe(true);
    expect(list.data?.find((c) => c.id === "pets")?.name).toBe("Pets & Animals");
  });

  it("a new category works with the storefront's by-slug product filter (id === slug invariant)", async () => {
    createCategory({ name: "Gardening" });
    createProduct({ ...product, categoryId: "gardening" });
    // ShopPage passes the URL slug straight into productsApi's categoryId filter.
    const list = await createStore().dispatch(productsApi.endpoints.getProducts.initiate({ categoryId: "gardening" }));
    expect(list.data?.map((p) => p.name)).toEqual(["Trowel"]);
  });

  it("search suggestions include a new category and use a renamed one", async () => {
    createCategory({ name: "Gardening" });
    updateCategory("pets", { name: "Animal Care" });
    const store = createStore();
    const garden = await store.dispatch(searchApi.endpoints.getSearchSuggestions.initiate("garden"));
    expect(garden.data?.categories.some((c) => c.slug === "gardening")).toBe(true);
    const renamed = await store.dispatch(searchApi.endpoints.getSearchSuggestions.initiate("animal"));
    expect(renamed.data?.categories.some((c) => c.id === "pets")).toBe(true);
  });

  it("recommendation reasons use the edited category name", async () => {
    const anchor = seed[0];
    updateCategory(anchor.categoryId, { name: "Audio Gear" });
    const sibling = seed.find((p) => p.id !== anchor.id && p.categoryId === anchor.categoryId);
    // Seed has no same-category sibling for p1; add one so the category-match reason is produced.
    if (!sibling) createProduct({ ...product, categoryId: anchor.categoryId });
    const related = await createStore().dispatch(
      recommendationsApi.endpoints.getRelatedProducts.initiate({ productId: anchor.id, limit: 1 })
    );
    expect(related.data?.[0]?.reason).toBe("Popular with Audio Gear shoppers");
  });

  it("the assistant understands a new category by name and recommends its products", async () => {
    createCategory({ name: "Gardening" });
    createProduct({ ...product, categoryId: "gardening", inventory: 5 });
    const reply = await mockAIProvider.sendMessage([], "show me something for gardening under $50");
    expect(reply.products?.map((p) => p.name)).toEqual(["Trowel"]);
  });

  it("admin category writes refresh a mounted storefront category list via tags; a rejected write doesn't", async () => {
    const store = createStore();
    const sub = store.dispatch(categoriesApi.endpoints.getCategories.initiate());
    await sub;
    const select = () => categoriesApi.endpoints.getCategories.select()(store.getState()).data;

    const rejected = await store.dispatch(adminApi.endpoints.createAdminCategory.initiate({ name: "   " }));
    expect("data" in rejected && rejected.data && !rejected.data.ok).toBe(true);
    expect(select()?.length).toBe(15);

    await store.dispatch(adminApi.endpoints.createAdminCategory.initiate({ name: "Gardening" }));
    await poll(() => select()?.some((c) => c.slug === "gardening") === true);
    sub.unsubscribe();
  });

  it("deleting through the admin API is blocked with a 409 while products remain, and allowed once empty", async () => {
    const store = createStore();
    const used = seed[0].categoryId;
    const blocked = await store.dispatch(adminApi.endpoints.deleteAdminCategory.initiate(used));
    expect("data" in blocked && blocked.data).toMatchObject({ ok: false, status: 409, reason: "hasProducts" });

    createCategory({ name: "Gardening" });
    const ok = await store.dispatch(adminApi.endpoints.deleteAdminCategory.initiate("gardening"));
    expect("data" in ok && ok.data?.ok).toBe(true);
  });

  it("admin category rows count active and archived products separately", async () => {
    createProduct({ ...product, categoryId: "pets" });
    const rows = await createStore().dispatch(adminApi.endpoints.getAdminCategories.initiate());
    expect(rows.data?.find((c) => c.id === "pets")).toMatchObject({ productCount: 1, archivedProductCount: 0 });
  });
});
