import { beforeEach, describe, expect, it } from "vitest";
import {
  createProduct,
  getProductById,
  listProducts,
  resetStore,
  updateProduct,
  type ProductInput,
} from "../../services/catalog/productStore";

// Product images are either external http(s) URLs or "/"-rooted paths to bundled assets (the seed
// products moved to local assets in 6ceb981, which the old http(s)-only check rejected on every update).

const valid: ProductInput = {
  name: "Lumen Desk Lamp",
  brand: "Lumen",
  categoryId: "home",
  price: 59.5,
  image: "https://example.com/lamp.jpg",
};

const asUpdate = (image: string): ProductInput => {
  const p = getProductById("p1")!;
  return { name: p.name, brand: p.brand, categoryId: p.categoryId, price: p.price, image };
};

const ACCEPTED = [
  "https://example.com/lamp.jpg",
  "http://example.com/lamp.jpg",
  "/assets/photo-1505740420928-5e560c06d30e-AbC123.jpg",
  "/src/assets/remote-images/photo-1505740420928-5e560c06d30e.jpg",
];

const REJECTED: Array<[string, string]> = [
  ["an empty string", ""],
  ["whitespace only", "   "],
  ["javascript:", "javascript:alert(1)"],
  ["data:", "data:image/png;base64,AAAA"],
  ["ftp://", "ftp://example.com/lamp.jpg"],
  ["a bare relative path", "assets/lamp.jpg"],
  ["a protocol-relative URL", "//evil.example.com/lamp.jpg"],
  ["a backslash host", "/\\evil.example.com/lamp.jpg"],
  ["a lone slash", "/"],
  ["a path with a space", "/assets/my lamp.jpg"],
];

describe("product image validation", () => {
  beforeEach(() => resetStore());

  describe("createProduct", () => {
    it.each(ACCEPTED)("accepts %s", (image) => {
      expect(createProduct({ ...valid, image }).ok).toBe(true);
    });

    it("trims a /-rooted path before storing it", () => {
      const result = createProduct({ ...valid, image: "  /assets/lamp.jpg  " });
      if (!result.ok) throw new Error("expected success");
      expect(result.product.image).toBe("/assets/lamp.jpg");
    });

    it.each(REJECTED)("rejects %s", (_label, image) => {
      const result = createProduct({ ...valid, image });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fields.image).toBeDefined();
    });

    it("keeps the specific errors: required for empty, invalidFormat for javascript:", () => {
      const empty = createProduct({ ...valid, image: "" });
      const js = createProduct({ ...valid, image: "javascript:alert(1)" });
      if (empty.ok || js.ok) throw new Error("expected failures");
      expect(empty.fields.image).toBe("required");
      expect(js.fields.image).toBe("invalidFormat");
    });
  });

  describe("updateProduct", () => {
    it.each(ACCEPTED)("accepts %s", (image) => {
      const result = updateProduct("p1", asUpdate(image));
      expect(result.ok).toBe(true);
      expect(getProductById("p1")?.image).toBe(image);
    });

    it.each(REJECTED)("rejects %s", (_label, image) => {
      const before = getProductById("p1")!.image;
      const result = updateProduct("p1", asUpdate(image));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fields.image).toBeDefined();
      expect(getProductById("p1")?.image).toBe(before);
    });

    it("keeps the specific errors: required for empty, invalidFormat for javascript:", () => {
      const empty = updateProduct("p1", asUpdate(""));
      const js = updateProduct("p1", asUpdate("javascript:alert(1)"));
      if (empty.ok || js.ok) throw new Error("expected failures");
      expect(empty.fields.image).toBe("required");
      expect(js.fields.image).toBe("invalidFormat");
    });

    it("every seeded product can be saved again with its own image unchanged (the 6ceb981 regression)", () => {
      for (const p of listProducts()) {
        const result = updateProduct(p.id, {
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          categoryId: p.categoryId,
          price: p.price,
          image: p.image,
        });
        expect(result.ok, `${p.id} (${p.image})`).toBe(true);
      }
    });
  });
});
