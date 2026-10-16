import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../renderWithProviders";
import { ShopPage } from "../../pages/shop/ShopPage";
import { listProducts } from "../../services/catalog/productStore";

// /deals, /new-arrivals and /trending used to render the unfiltered shop.
describe.each([
  { path: "/deals", badge: "deal", titleKey: "deals", title: "Deals" },
  { path: "/new-arrivals", badge: "new", titleKey: "newArrivals", title: "New arrivals" },
  { path: "/trending", badge: "trending", titleKey: "trending", title: "Trending" },
] as const)("$path", ({ path, badge, titleKey, title }) => {
  it(`shows only products badged "${badge}", under the right heading`, async () => {
    renderWithProviders(<ShopPage badge={badge} titleKey={titleKey} />, { route: path, path });

    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();

    const matching = listProducts().filter((p) => p.badge === badge);
    const others = listProducts().filter((p) => p.badge !== badge);
    expect(matching.length).toBeGreaterThan(0); // guards the test against the seed data changing
    expect(others.length).toBeGreaterThan(0);

    for (const product of matching) {
      expect(await screen.findAllByText(product.name)).toHaveLength(1);
    }
    for (const product of others) {
      expect(screen.queryByText(product.name)).not.toBeInTheDocument();
    }
  });
});

describe("/shop without a badge", () => {
  it("is unchanged: every product, and the plain Shop heading", async () => {
    renderWithProviders(<ShopPage />, { route: "/shop", path: "/shop" });

    expect(screen.getByRole("heading", { level: 1, name: "Shop" })).toBeInTheDocument();
    const all = listProducts();
    expect(await screen.findAllByText(all[0].name)).toHaveLength(1);
    for (const product of all) {
      expect(screen.getAllByText(product.name)).toHaveLength(1);
    }
  });
});
