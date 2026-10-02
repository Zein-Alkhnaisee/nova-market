import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  countProductsInCategory,
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  resetStore,
  updateCategory,
  type CategoryInput,
} from "../../services/catalog/categoryStore";
import {
  archiveProduct,
  createProduct,
  resetStore as resetProducts,
  updateProduct,
  getProductById,
} from "../../services/catalog/productStore";
import { categories as seed } from "../../mocks/data/categories";
import { products as seedProducts } from "../../mocks/data/products";

const KEY = "nova:categories:v1";
const fail = (r: ReturnType<typeof createCategory>) => {
  if (r.ok) throw new Error("expected a failure");
  return r;
};
// A seed category with no products (safe to delete) and one with products.
const emptyCat = seed.find((c) => !seedProducts.some((p) => p.categoryId === c.id))!;
const usedCat = seed.find((c) => seedProducts.some((p) => p.categoryId === c.id))!;

describe("categoryStore", () => {
  beforeEach(() => {
    resetStore();
    resetProducts();
  });

  describe("seed and reads", () => {
    it("serves the static mock as seed data when nothing is stored, without writing storage", () => {
      expect(listCategories()).toHaveLength(seed.length);
      expect(window.localStorage.getItem(KEY)).toBeNull();
    });

    it("never mutates the static seed data", () => {
      const before = JSON.stringify(seed);
      createCategory({ name: "Gardening" });
      updateCategory(usedCat.id, { name: "Renamed" });
      deleteCategory(emptyCat.id);
      expect(JSON.stringify(seed)).toBe(before);
    });

    it("resetStore forgets edits and stored data", () => {
      createCategory({ name: "Gardening" });
      resetStore();
      expect(window.localStorage.getItem(KEY)).toBeNull();
      expect(listCategories()).toHaveLength(seed.length);
    });

    it("every seed category keeps the id === slug invariant the storefront relies on", () => {
      expect(seed.every((c) => c.id === c.slug)).toBe(true);
    });
  });

  describe("create", () => {
    it("creates with id === slug, a generated slug, and persists under the versioned key", () => {
      const result = createCategory({ name: "Garden & Outdoors" });
      if (!result.ok) throw new Error("create failed");
      expect(result.category).toMatchObject({ id: "garden-outdoors", slug: "garden-outdoors", name: "Garden & Outdoors" });
      const stored = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
      expect(stored.version).toBe(1);
      expect(stored.items).toHaveLength(seed.length + 1);
    });

    it("keeps an explicit slug and an optional image", () => {
      const result = createCategory({ name: "Gardening", slug: "garden", image: "https://example.com/g.jpg" });
      if (!result.ok) throw new Error("create failed");
      expect(result.category).toMatchObject({ id: "garden", slug: "garden", image: "https://example.com/g.jpg" });
    });

    it("survives a reload (fresh module instance reads the stored categories)", async () => {
      createCategory({ name: "Gardening" });
      vi.resetModules();
      const fresh = await import("../../services/catalog/categoryStore");
      expect(fresh.getCategoryById("gardening")?.name).toBe("Gardening");
    });

    it.each([
      ["a blank name", { name: "  " }, "name", "required"],
      ["an over-long name", { name: "x".repeat(61) }, "name", "tooLong"],
      ["a malformed slug", { name: "Gardening", slug: "Not A Slug" }, "slug", "invalidFormat"],
      ["a non-http image", { name: "Gardening", image: "ftp://x" }, "image", "invalidFormat"],
    ] as const)("rejects %s", (_l, input, field, code) => {
      const r = fail(createCategory(input as CategoryInput));
      expect(r.status).toBe(400);
      expect(r.fields[field]).toBe(code);
      expect(listCategories()).toHaveLength(seed.length);
    });

    it("rejects a duplicate name (case-insensitive) and a duplicate slug as 409", () => {
      expect(fail(createCategory({ name: usedCat.name.toUpperCase() }))).toMatchObject({ status: 409, fields: { name: "taken" } });
      expect(fail(createCategory({ name: "Something New", slug: usedCat.slug }))).toMatchObject({ status: 409, fields: { slug: "taken" } });
    });
  });

  describe("update", () => {
    it("changes name and image but never the id or slug", () => {
      const r = updateCategory(usedCat.id, { name: "Brand New Name", image: "https://example.com/c.jpg" });
      if (!r.ok) throw new Error("update failed");
      expect(r.category).toMatchObject({ id: usedCat.id, slug: usedCat.slug, name: "Brand New Name", image: "https://example.com/c.jpg" });
      expect(getCategoryById(usedCat.id)?.name).toBe("Brand New Name");
    });

    it("an update can't smuggle in a slug change", () => {
      const r = updateCategory(usedCat.id, { name: "X Name", slug: "hacked" } as never);
      if (!r.ok) throw new Error("update failed");
      expect(r.category.slug).toBe(usedCat.slug);
      expect(getCategoryById("hacked")).toBeUndefined();
    });

    it("can clear the image, may keep its own name, and rejects another category's name", () => {
      updateCategory(usedCat.id, { name: usedCat.name, image: "https://example.com/c.jpg" });
      const cleared = updateCategory(usedCat.id, { name: usedCat.name, image: null });
      if (!cleared.ok) throw new Error("update failed");
      expect(cleared.category.image).toBeUndefined();
      const other = seed.find((c) => c.id !== usedCat.id)!;
      expect(fail(updateCategory(usedCat.id, { name: other.name.toLowerCase() })).status).toBe(409);
    });

    it("returns 404 for an unknown id", () => {
      expect(fail(updateCategory("nope", { name: "X" })).status).toBe(404);
    });
  });

  describe("delete — the 409 constraint", () => {
    it("deletes a category with no products and persists the removal", () => {
      const r = deleteCategory(emptyCat.id);
      expect(r.ok).toBe(true);
      expect(getCategoryById(emptyCat.id)).toBeUndefined();
      expect(JSON.parse(window.localStorage.getItem(KEY)!).items.some((c: { id: string }) => c.id === emptyCat.id)).toBe(false);
    });

    it("refuses with 409 and a count while active products belong to it, and removes nothing", () => {
      const expected = seedProducts.filter((p) => p.categoryId === usedCat.id).length;
      expect(deleteCategory(usedCat.id)).toEqual({ ok: false, status: 409, reason: "hasProducts", productCount: expected });
      expect(getCategoryById(usedCat.id)).toBeDefined();
    });

    it("ARCHIVED products still block deletion (so a restore can't orphan a product)", () => {
      const only = seedProducts.filter((p) => p.categoryId === usedCat.id);
      only.forEach((p) => archiveProduct(p.id));
      expect(countProductsInCategory(usedCat.id)).toBe(only.length);
      expect(deleteCategory(usedCat.id)).toMatchObject({ ok: false, status: 409, reason: "hasProducts" });
    });

    it("becomes deletable once its products are moved to another category", () => {
      const only = seedProducts.filter((p) => p.categoryId === usedCat.id);
      const target = seed.find((c) => c.id !== usedCat.id)!;
      for (const p of only) {
        const full = getProductById(p.id)!;
        updateProduct(p.id, { name: full.name, brand: full.brand, categoryId: target.id, price: full.price, image: full.image });
      }
      expect(deleteCategory(usedCat.id).ok).toBe(true);
    });

    it("returns 404 for an unknown id", () => {
      expect(deleteCategory("nope")).toEqual({ ok: false, status: 404 });
    });
  });

  describe("the product store validates against THIS store", () => {
    const base = { name: "Trowel", brand: "Spade", price: 12, image: "https://example.com/t.jpg" };

    it("accepts a product in a newly created category and rejects one in a deleted category", () => {
      createCategory({ name: "Gardening" });
      expect(createProduct({ ...base, categoryId: "gardening" }).ok).toBe(true);
      deleteCategory(emptyCat.id);
      const r = createProduct({ ...base, name: "Other", categoryId: emptyCat.id });
      expect(r).toMatchObject({ ok: false, fields: { categoryId: "unknownCategory" } });
    });
  });

  describe("corrupt or mismatched storage falls back to the seed instead of crashing", () => {
    const seeded = () => expect(listCategories()).toHaveLength(seed.length);
    it("unparseable JSON", () => { window.localStorage.setItem(KEY, "{bad"); seeded(); });
    it("a different version", () => { window.localStorage.setItem(KEY, JSON.stringify({ version: 2, items: [{ id: "a", slug: "a", name: "A" }] })); seeded(); });
    it("items with the wrong shape", () => { window.localStorage.setItem(KEY, JSON.stringify({ version: 1, items: [{ id: 1 }] })); seeded(); });
    it("an id that breaks the id === slug invariant", () => { window.localStorage.setItem(KEY, JSON.stringify({ version: 1, items: [{ id: "a", slug: "b", name: "A" }] })); seeded(); });
    it("an empty list", () => { window.localStorage.setItem(KEY, JSON.stringify({ version: 1, items: [] })); seeded(); });
    it("recovers: a later write replaces the bad data", () => {
      window.localStorage.setItem(KEY, "{bad");
      createCategory({ name: "Gardening" });
      expect(JSON.parse(window.localStorage.getItem(KEY)!).version).toBe(1);
    });
  });
});
