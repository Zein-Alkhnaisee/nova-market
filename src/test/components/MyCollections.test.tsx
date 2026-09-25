import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import i18n from "../../i18n/config";
import { createTestStore } from "../renderWithProviders";
import { setSession } from "../../features/auth/authSlice";
import { createCollection } from "../../features/account/userCollectionsSlice";
import { MyCollectionsPage } from "../../pages/account/MyCollectionsPage";
import { MyCollectionDetailPage } from "../../pages/account/MyCollectionDetailPage";

function renderAccountCollections(store: ReturnType<typeof createTestStore>, initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: "/account/collections", element: <MyCollectionsPage /> },
      { path: "/account/collections/:id", element: <MyCollectionDetailPage /> },
      { path: "/auth/login", element: <div>Login page</div> },
    ],
    { initialEntries: [initialPath] }
  );
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>
  );
}

function authenticatedStore() {
  const store = createTestStore();
  store.dispatch(setSession({ id: "u1", fullName: "Jordan Lee", email: "jordan@example.com" }));
  return store;
}

describe("MyCollectionsPage", () => {
  it("redirects an unauthenticated visitor to login", async () => {
    const store = createTestStore();
    renderAccountCollections(store, "/account/collections");
    await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());
  });

  it("shows an empty state with no collections", async () => {
    const store = authenticatedStore();
    renderAccountCollections(store, "/account/collections");
    await waitFor(() => {
      expect(screen.getByText("You haven't created any collections yet.")).toBeInTheDocument();
    });
  });

  it("creates a new collection through the UI", async () => {
    const user = userEvent.setup();
    const store = authenticatedStore();
    renderAccountCollections(store, "/account/collections");

    await user.click(screen.getByRole("button", { name: "New collection" }));
    await user.type(screen.getByPlaceholderText("Collection name"), "Gift ideas");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Gift ideas")).toBeInTheDocument();
    });
    expect(store.getState().userCollections.items).toHaveLength(1);
  });
});

describe("MyCollectionDetailPage", () => {
  it("shows a not-found state for an unknown collection id", async () => {
    const store = authenticatedStore();
    renderAccountCollections(store, "/account/collections/does-not-exist");
    await waitFor(() => {
      expect(screen.getByText(/couldn't find that collection/i)).toBeInTheDocument();
    });
  });

  it("toggles visibility and shows the share link once public", async () => {
    const user = userEvent.setup();
    const store = authenticatedStore();
    store.dispatch(createCollection({ name: "Gift ideas", productIds: ["p1"] }));
    const id = store.getState().userCollections.items[0].id;

    renderAccountCollections(store, `/account/collections/${id}`);
    await waitFor(() => expect(screen.getByText("Gift ideas")).toBeInTheDocument());

    expect(screen.queryByText("Share link", { exact: false })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /make public/i }));

    await waitFor(() => {
      expect(store.getState().userCollections.items[0].isPublic).toBe(true);
    });
    expect(screen.getByText(/\/c\//)).toBeInTheDocument();
  });

  it("renames a collection", async () => {
    const user = userEvent.setup();
    const store = authenticatedStore();
    store.dispatch(createCollection({ name: "Old name" }));
    const id = store.getState().userCollections.items[0].id;

    renderAccountCollections(store, `/account/collections/${id}`);
    await waitFor(() => expect(screen.getByText("Old name")).toBeInTheDocument());

    await user.click(screen.getByText("Old name"));
    const input = screen.getByDisplayValue("Old name");
    await user.clear(input);
    await user.type(input, "New name");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(store.getState().userCollections.items[0].name).toBe("New name");
    });
  });
});
