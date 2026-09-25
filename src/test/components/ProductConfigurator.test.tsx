import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import { ProductDetailPage } from "../../pages/product/ProductDetailPage";
import { selectCartLines } from "../../features/cart/cartSlice";

describe("Product configurator (PDP integration)", () => {
  it("renders configurator groups instead of a plain variant selector for a configurable product", async () => {
    renderWithProviders(<ProductDetailPage />, {
      route: "/product/nova-forge-custom-pc",
      path: "/product/:slug",
    });
    await waitFor(() => expect(screen.getByText("Build your own")).toBeInTheDocument());
    expect(screen.getByRole("radiogroup", { name: "CPU" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "GPU" })).toBeInTheDocument();
  });

  it("defaults to the base configuration and shows the base price", async () => {
    renderWithProviders(<ProductDetailPage />, {
      route: "/product/nova-forge-custom-pc",
      path: "/product/:slug",
    });
    await waitFor(() => expect(screen.getByText("Build your own")).toBeInTheDocument());
    // Base price is $1,499 with every group defaulted to its $0-delta option.
    expect(screen.getByText("$1,499")).toBeInTheDocument();
  });

  it("updates the displayed price when a higher-tier option is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductDetailPage />, {
      route: "/product/nova-forge-custom-pc",
      path: "/product/:slug",
    });
    await waitFor(() => expect(screen.getByText("Build your own")).toBeInTheDocument());

    await user.click(screen.getByRole("radio", { name: /RTX high-end, 16GB/i }));

    await waitFor(() => {
      // 1499 + 550 (RTX high-end) = 2049
      expect(screen.getByText("$2,049")).toBeInTheDocument();
    });
  });

  it("adds the configured price and a human-readable summary to the cart", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ProductDetailPage />, {
      route: "/product/nova-forge-custom-pc",
      path: "/product/:slug",
    });
    await waitFor(() => expect(screen.getByText("Build your own")).toBeInTheDocument());

    await user.click(screen.getByRole("radio", { name: /RTX high-end, 16GB/i }));
    await user.click(screen.getByRole("button", { name: /add to cart/i }));

    await waitFor(() => {
      const lines = selectCartLines(store.getState());
      expect(lines).toHaveLength(1);
      expect(lines[0].price).toBe(2049);
      expect(lines[0].configurationSummary).toContain("RTX high-end, 16GB");
    });
  });

  it("a non-configurable product still shows its plain variant selector, unaffected", async () => {
    renderWithProviders(<ProductDetailPage />, {
      route: "/product/horizon-smart-watch",
      path: "/product/:slug",
    });
    await waitFor(() => expect(screen.getByText("Horizon Smart Watch")).toBeInTheDocument());
    expect(screen.queryByText("Build your own")).not.toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Case" })).toBeInTheDocument();
  });
});
