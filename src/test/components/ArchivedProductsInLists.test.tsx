import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { WishlistPage } from "../../pages/account/WishlistPage";
import { CollectionDetailPage } from "../../pages/collections/CollectionDetailPage";
import { createTestStore, renderWithProviders } from "../renderWithProviders";
import { toggleWishlist } from "../../features/wishlist/wishlistSlice";
import { archiveProduct } from "../../services/catalog/productStore";
import { collections } from "../../mocks/data/collections";
import { products as seed } from "../../mocks/data/products";

const nameOf = (id: string) => seed.find((p) => p.id === id)!.name;

// Decision (HANDOFF §11): lists that hold product ids (wishlist, collections,
// recently viewed) silently drop archived products — they resolve ids against
// the storefront catalog, which already excludes archived ones.
describe("archived products inside id-based lists", () => {
  it("the wishlist keeps showing the active products and silently drops the archived one", async () => {
    const store = createTestStore();
    store.dispatch(toggleWishlist("p2"));
    store.dispatch(toggleWishlist("p3"));
    archiveProduct("p2");

    renderWithProviders(<WishlistPage />, { store });
    expect(await screen.findByText(nameOf("p3"))).toBeInTheDocument();
    expect(screen.queryByText(nameOf("p2"))).not.toBeInTheDocument();
  });

  it("a wishlist of only archived products falls back to the empty state, not an error", async () => {
    const store = createTestStore();
    store.dispatch(toggleWishlist("p2"));
    archiveProduct("p2");
    renderWithProviders(<WishlistPage />, { store });
    expect(await screen.findByText("Nothing here yet")).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it("an editorial collection drops an archived product but still renders the rest", async () => {
    const collection = collections.find((c) => c.productIds.length >= 2)!;
    const [archivedId, keptId] = collection.productIds;
    archiveProduct(archivedId);
    renderWithProviders(
      <Routes>
        <Route path="/collections/:slug" element={<CollectionDetailPage />} />
      </Routes>,
      { route: `/collections/${collection.slug}` }
    );
    expect(await screen.findByText(nameOf(keptId))).toBeInTheDocument();
    expect(screen.queryByText(nameOf(archivedId))).not.toBeInTheDocument();
  });
});
