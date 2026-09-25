import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import { ProductDetailPage } from "../../pages/product/ProductDetailPage";
import { selectRecentlyViewedIds } from "../../features/products/recentlyViewedSlice";

describe("ProductDetailPage", () => {
  it("renders product info and records it as recently viewed", async () => {
    const { store } = renderWithProviders(<ProductDetailPage />, {
      route: "/product/horizon-smart-watch",
      path: "/product/:slug",
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Horizon Smart Watch" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(selectRecentlyViewedIds(store.getState())).toContain("p4");
    });
  });

  it("lets the user pick a variant option", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductDetailPage />, { route: "/product/horizon-smart-watch", path: "/product/:slug" });

    await waitFor(() => expect(screen.getByText("Steel")).toBeInTheDocument());
    const blackOption = screen.getByRole("radio", { name: "Black" });
    expect(blackOption).toHaveAttribute("aria-checked", "false");
    await user.click(blackOption);
    expect(blackOption).toHaveAttribute("aria-checked", "true");
  });

  it("increments quantity with the stepper", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductDetailPage />, { route: "/product/horizon-smart-watch", path: "/product/:slug" });

    await waitFor(() => expect(screen.getByText("Horizon Smart Watch")).toBeInTheDocument());
    const increaseButton = screen.getByRole("button", { name: /increase quantity/i });
    await user.click(increaseButton);
    await user.click(increaseButton);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows an error state with retry for an unknown product", async () => {
    renderWithProviders(<ProductDetailPage />, { route: "/product/does-not-exist", path: "/product/:slug" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });
  });
});
