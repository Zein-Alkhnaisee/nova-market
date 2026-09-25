import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, createTestStore } from "../renderWithProviders";
import { PublicCollectionPage } from "../../pages/collections/PublicCollectionPage";
import { createCollection, setCollectionVisibility } from "../../features/account/userCollectionsSlice";

describe("PublicCollectionPage", () => {
  it("shows a not-found state for a collection id that doesn't exist", async () => {
    renderWithProviders(<PublicCollectionPage />, {
      route: "/c/does-not-exist",
      path: "/c/:id",
    });
    await waitFor(() => {
      expect(screen.getByText(/couldn't find that collection/i)).toBeInTheDocument();
    });
  });

  it("renders a public collection's products", async () => {
    const store = createTestStore();
    store.dispatch(createCollection({ name: "Gift ideas", productIds: ["p1", "p2"] }));
    const id = store.getState().userCollections.items[0].id;
    store.dispatch(setCollectionVisibility({ id, isPublic: true }));

    renderWithProviders(<PublicCollectionPage />, {
      route: `/c/${id}`,
      path: "/c/:id",
      store,
    });

    await waitFor(() => {
      expect(screen.getByText("Gift ideas")).toBeInTheDocument();
      expect(screen.getByText("Aether Noise-Cancelling Headphones")).toBeInTheDocument();
      expect(screen.getByText("Kite 13 Ultralight Laptop")).toBeInTheDocument();
    });
  });

  it("shows the same not-found state for a private collection — never reveals it exists", async () => {
    const store = createTestStore();
    store.dispatch(createCollection({ name: "Secret list", productIds: ["p1"] }));
    const id = store.getState().userCollections.items[0].id;
    // isPublic defaults to false — do not toggle it.

    renderWithProviders(<PublicCollectionPage />, {
      route: `/c/${id}`,
      path: "/c/:id",
      store,
    });

    await waitFor(() => {
      expect(screen.getByText(/couldn't find that collection/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("Secret list")).not.toBeInTheDocument();
  });
});
