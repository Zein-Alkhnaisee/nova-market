import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  archiveProduct,
  createProduct,
  getProductById,
  listProducts,
  resetStore,
  restoreProduct,
  updateProduct,
  type ProductInput,
} from "../../services/catalog/productStore";
import { products as seed } from "../../mocks/data/products";

const KEY = "nova:products:v1";

const valid: ProductInput = {
  name: "Lumen Desk Lamp",
  brand: "Lumen",
  categoryId: "home",
  price: 59.5,
  image: "https://example.com/lamp.jpg",
};

function expectFailure(result: ReturnType<typeof createProduct>) {
  if (result.ok) throw new Error("expected a failure");
  return result;
}

describe("productStore", () => {
  // setup.ts resets the store after every test; reset here too so each test's
  // starting point is explicit rather than inherited.
  beforeEach(() => resetStore());

  describe("seed and reads", () => {
    it("serves the static mock as seed data when nothing is stored, without writing storage", () => {
      expect(listProducts()).toHaveLength(seed.length);
      expect(window.localStorage.getItem(KEY)).toBeNull();
    });

    it("hides archived products from default reads and shows them only when asked", () => {
      archiveProduct("p1");
      expect(listProducts().some((p) => p.id === "p1")).toBe(false);
      expect(getProductById("p1")).toBeUndefined();
      expect(listProducts({ includeArchived: true }).some((p) => p.id === "p1")).toBe(true);
      expect(getProductById("p1", { includeArchived: true })?.archivedAt).toBeDefined();
    });

    it("never mutates the static seed data", () => {
      const before = JSON.stringify(seed);
      updateProduct("p1", { ...valid, name: "Renamed", categoryId: "electronics", price: 1 });
      archiveProduct("p2");
      expect(JSON.stringify(seed)).toBe(before);
    });

    it("resetStore forgets edits and stored data", () => {
      createProduct(valid);
      archiveProduct("p1");
      resetStore();
      expect(window.localStorage.getItem(KEY)).toBeNull();
      expect(listProducts()).toHaveLength(seed.length);
    });
  });

  describe("create", () => {
    it("creates, generates id and slug, defaults rating/reviews, and is visible to default reads", () => {
      const result = createProduct(valid);
      if (!result.ok) throw new Error("create failed");
      expect(result.product.id).toMatch(/^prod-/);
      expect(result.product.slug).toBe("lumen-desk-lamp");
      expect(result.product).toMatchObject({ rating: 0, reviewCount: 0, currency: "USD", price: 59.5, inStock: true });
      expect(listProducts().some((p) => p.id === result.product.id)).toBe(true);
    });

    it("persists under the versioned key", () => {
      createProduct(valid);
      const stored = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
      expect(stored.version).toBe(1);
      expect(stored.items).toHaveLength(seed.length + 1);
      expect(window.localStorage.getItem("nova:products")).toBeNull();
    });

    it("survives a reload (fresh module instance reads the stored catalog)", async () => {
      const created = createProduct(valid);
      if (!created.ok) throw new Error("create failed");
      vi.resetModules();
      const fresh = await import("../../services/catalog/productStore");
      expect(fresh.getProductById(created.product.id)?.name).toBe("Lumen Desk Lamp");
    });

    it.each([
      ["a blank name", { name: "  " }, "name", "required"],
      ["an over-long name", { name: "x".repeat(121) }, "name", "tooLong"],
      ["a blank brand", { brand: "" }, "brand", "required"],
      ["no category", { categoryId: "" }, "categoryId", "required"],
      ["an unknown category", { categoryId: "nope" }, "categoryId", "unknownCategory"],
      ["a missing price", { price: NaN }, "price", "required"],
      ["a zero price", { price: 0 }, "price", "mustBePositive"],
      ["a negative price", { price: -5 }, "price", "mustBePositive"],
      ["a previous price not above the price", { previousPrice: 59.5 }, "previousPrice", "mustExceedPrice"],
      ["a non-http image", { image: "javascript:alert(1)" }, "image", "invalidFormat"],
      ["a missing image", { image: "" }, "image", "required"],
      ["a fractional inventory", { inventory: 2.5 }, "inventory", "mustBeWholeNumber"],
      ["a negative inventory", { inventory: -1 }, "inventory", "mustBeWholeNumber"],
      ["a malformed slug", { slug: "Not A Slug!" }, "slug", "invalidFormat"],
    ] as const)("rejects %s", (_label, patch, field, code) => {
      const result = expectFailure(createProduct({ ...valid, ...patch } as ProductInput));
      expect(result.status).toBe(400);
      expect(result.fields[field]).toBe(code);
      expect(listProducts()).toHaveLength(seed.length); // nothing was written
    });

    it("rejects a slug already used — including by an archived product — as a 409", () => {
      const taken = seed[0].slug;
      const clash = expectFailure(createProduct({ ...valid, slug: taken }));
      expect(clash).toMatchObject({ status: 409, fields: { slug: "taken" } });

      archiveProduct(seed[0].id);
      const stillClash = expectFailure(createProduct({ ...valid, slug: taken }));
      expect(stillClash.status).toBe(409);
    });

    it("reports every invalid field at once", () => {
      const result = expectFailure(createProduct({ ...valid, name: "", price: -1, image: "" }));
      expect(Object.keys(result.fields).sort()).toEqual(["image", "name", "price"]);
    });
  });

  describe("update", () => {
    it("updates fields, keeps identity/rating/reviews, and persists", () => {
      const before = getProductById("p1")!;
      const result = updateProduct("p1", {
        name: before.name,
        brand: before.brand,
        categoryId: before.categoryId,
        price: 199,
        previousPrice: 299,
        image: before.image,
      });
      if (!result.ok) throw new Error("update failed");
      expect(result.product).toMatchObject({ id: "p1", price: 199, rating: before.rating, reviewCount: before.reviewCount });
      expect(getProductById("p1")?.price).toBe(199);
      expect(JSON.parse(window.localStorage.getItem(KEY)!).items.find((p: { id: string }) => p.id === "p1").price).toBe(199);
    });

    it("lets a product keep its own slug but not take another's", () => {
      const p1 = getProductById("p1")!;
      const base: ProductInput = { name: p1.name, brand: p1.brand, categoryId: p1.categoryId, price: p1.price, image: p1.image };
      expect(updateProduct("p1", { ...base, slug: p1.slug }).ok).toBe(true);
      expect(expectFailure(updateProduct("p1", { ...base, slug: seed[1].slug })).status).toBe(409);
    });

    it("returns 404 for an unknown id", () => {
      expect(expectFailure(updateProduct("nope", valid)).status).toBe(404);
    });

    it("keeps inStock consistent with inventory", () => {
      const p = getProductById("p1")!;
      const base: ProductInput = { name: p.name, brand: p.brand, categoryId: p.categoryId, price: p.price, image: p.image };
      updateProduct("p1", { ...base, inventory: 0 });
      expect(getProductById("p1")).toMatchObject({ inventory: 0, inStock: false });
      updateProduct("p1", { ...base, inventory: 7 });
      expect(getProductById("p1")).toMatchObject({ inventory: 7, inStock: true });
    });

    it("leaves availability alone when inventory is left untracked", () => {
      const out = seed.find((p) => !p.inStock);
      if (!out) return; // seed has no out-of-stock product; nothing to assert
      updateProduct(out.id, { name: out.name, brand: out.brand, categoryId: out.categoryId, price: out.price, image: out.image });
      expect(getProductById(out.id)?.inStock).toBe(false);
    });

    it("drops a stale gallery when the main image changes, but keeps it otherwise", () => {
      const p = getProductById("p1")!;
      expect(p.images?.length).toBeGreaterThan(0);
      const base: ProductInput = { name: p.name, brand: p.brand, categoryId: p.categoryId, price: p.price, image: p.image };
      updateProduct("p1", { ...base, price: 100 });
      expect(getProductById("p1")?.images?.length).toBeGreaterThan(0);
      updateProduct("p1", { ...base, image: "https://example.com/new.jpg" });
      expect(getProductById("p1")?.images).toBeUndefined();
    });

    it("can clear optional fields", () => {
      const p = getProductById("p1")!;
      updateProduct("p1", { name: p.name, brand: p.brand, categoryId: p.categoryId, price: p.price, image: p.image, previousPrice: null, badge: null, description: "" });
      const after = getProductById("p1")!;
      expect(after.previousPrice).toBeUndefined();
      expect(after.badge).toBeUndefined();
      expect(after.description).toBeUndefined();
    });
  });

  describe("archive / restore", () => {
    it("archives and restores, round-tripping", () => {
      expect(archiveProduct("p3").ok).toBe(true);
      expect(getProductById("p3")).toBeUndefined();
      expect(restoreProduct("p3").ok).toBe(true);
      expect(getProductById("p3")?.archivedAt).toBeUndefined();
    });

    it("is idempotent and 404s on unknown ids", () => {
      archiveProduct("p3");
      expect(archiveProduct("p3").ok).toBe(true);
      expect(restoreProduct("p4").ok).toBe(true); // not archived: no-op, not an error
      expect(expectFailure(archiveProduct("nope")).status).toBe(404);
      expect(expectFailure(restoreProduct("nope")).status).toBe(404);
    });

    it("persists archive state across a reload", async () => {
      archiveProduct("p3");
      vi.resetModules();
      const fresh = await import("../../services/catalog/productStore");
      expect(fresh.getProductById("p3")).toBeUndefined();
      expect(fresh.getProductById("p3", { includeArchived: true })).toBeDefined();
    });
  });

  describe("corrupt or mismatched storage falls back to the seed instead of crashing", () => {
    const seeded = () => expect(listProducts()).toHaveLength(seed.length);

    it("unparseable JSON", () => {
      window.localStorage.setItem(KEY, "{not json");
      seeded();
    });
    it("a different version", () => {
      window.localStorage.setItem(KEY, JSON.stringify({ version: 2, items: [{ ...seed[0], name: "FROM FUTURE" }] }));
      seeded();
      expect(listProducts().some((p) => p.name === "FROM FUTURE")).toBe(false);
    });
    it("items with the wrong shape", () => {
      window.localStorage.setItem(KEY, JSON.stringify({ version: 1, items: [{ id: "x", price: "free" }] }));
      seeded();
    });
    it("an empty catalog", () => {
      window.localStorage.setItem(KEY, JSON.stringify({ version: 1, items: [] }));
      seeded();
    });
    it("a non-object payload", () => {
      window.localStorage.setItem(KEY, JSON.stringify(["nope"]));
      seeded();
    });
    it("recovers: a write after corrupt storage replaces it with valid data", () => {
      window.localStorage.setItem(KEY, "{bad");
      createProduct(valid);
      expect(JSON.parse(window.localStorage.getItem(KEY)!).version).toBe(1);
    });
  });
});
