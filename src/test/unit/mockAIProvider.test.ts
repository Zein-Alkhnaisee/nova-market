import { describe, expect, it } from "vitest";
import { mockAIProvider } from "../../services/assistant/mockAIProvider";

async function ask(message: string) {
  return mockAIProvider.sendMessage([], message);
}

describe("mockAIProvider", () => {
  it("responds to a greeting without products", async () => {
    const response = await ask("Hello");
    expect(response.role).toBe("assistant");
    expect(response.products).toBeUndefined();
    expect(response.content.length).toBeGreaterThan(0);
  });

  it("recommends in-category, in-budget products for a budget + category query", async () => {
    const response = await ask("Find me a laptop under $1500");
    expect(response.products?.length).toBeGreaterThan(0);
    expect(response.products?.every((p) => p.categoryId === "computers")).toBe(true);
    expect(response.products?.every((p) => p.price <= 1500)).toBe(true);
  });

  it("gives each recommended product view/cart/compare actions", async () => {
    const response = await ask("Find me a laptop under $1500");
    const product = response.products?.[0];
    expect(product).toBeDefined();
    const cartAndCompareTypes = response.actions
      ?.filter((a) => a.payload === product?.id)
      .map((a) => a.type);
    expect(cartAndCompareTypes).toEqual(expect.arrayContaining(["add_to_cart", "add_to_compare"]));
    // view_product links by slug, not id, since it's a route param — a
    // separate assertion rather than folding it into the id-filtered check above.
    expect(response.actions?.some((a) => a.type === "view_product" && a.payload === product?.slug)).toBe(
      true
    );
  });

  it("says so honestly when nothing matches the budget", async () => {
    const response = await ask("Find me a laptop under $5");
    expect(response.products).toBeUndefined();
    expect(response.content.toLowerCase()).toContain("couldn't find");
  });

  it("returns a comparison with a view_comparison action when two named products are mentioned", async () => {
    const response = await ask("Compare the Aether Noise-Cancelling Headphones and the Kite 13 Ultralight Laptop");
    expect(response.products?.length).toBe(2);
    expect(response.actions?.some((a) => a.type === "view_comparison")).toBe(true);
    const comparison = response.actions?.find((a) => a.type === "view_comparison");
    expect(comparison?.payload.split(",")).toHaveLength(2);
  });

  it("asks for a second product when only one is named in a compare request", async () => {
    const response = await ask("Compare the Kite 13 Ultralight Laptop");
    expect(response.products?.length).toBe(1);
    expect(response.actions).toBeUndefined();
  });

  it("asks for product names when a compare request names nothing recognizable", async () => {
    const response = await ask("Compare some stuff for me");
    expect(response.products).toBeUndefined();
  });

  it("explains specs for a named product", async () => {
    const response = await ask("What are the specs for the Pulse Mechanical Keyboard?");
    expect(response.content).toContain("Pulse Mechanical Keyboard");
    expect(response.products?.[0]?.slug).toBe("pulse-mechanical-keyboard");
  });

  it("suggests gift ideas by recipient category", async () => {
    const response = await ask("Find a gift for a gamer");
    expect(response.products?.length).toBeGreaterThan(0);
    expect(response.products?.every((p) => p.categoryId === "gaming")).toBe(true);
  });

  it("falls back to premium/trending picks for an ungrounded gift request", async () => {
    const response = await ask("I need a gift idea");
    expect(response.products?.length).toBeGreaterThan(0);
    expect(response.products?.every((p) => p.badge === "premium" || p.badge === "trending")).toBe(true);
  });

  it("falls back to a keyword search when nothing else matches", async () => {
    const response = await ask("something about a mechanical keyboard please");
    expect(response.products?.some((p) => p.slug === "pulse-mechanical-keyboard")).toBe(true);
  });

  it("offers a real search action as a last resort for a totally unmatched query", async () => {
    const response = await ask("xyzzyplugh quantum flavored nonsense");
    expect(response.products).toBeUndefined();
    expect(response.actions?.[0]).toMatchObject({ type: "search" });
  });

  it("every response has a valid role, id, and createdAt timestamp", async () => {
    const response = await ask("hi there");
    expect(response.id).toBeTruthy();
    expect(response.role).toBe("assistant");
    expect(new Date(response.createdAt).toString()).not.toBe("Invalid Date");
  });
});
