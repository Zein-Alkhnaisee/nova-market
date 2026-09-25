import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, createTestStore } from "../renderWithProviders";
import { ComparePage } from "../../pages/compare/ComparePage";
import { toggleCompare } from "../../features/compare/compareSlice";

describe("ComparePage", () => {
  it("shows an empty state when nothing is being compared", async () => {
    renderWithProviders(<ComparePage />, { route: "/compare" });
    await waitFor(() => {
      expect(screen.getByText(/haven't added anything to compare/i)).toBeInTheDocument();
    });
  });

  it("renders a comparison table for selected products", async () => {
    const store = createTestStore();
    store.dispatch(toggleCompare("p1"));
    store.dispatch(toggleCompare("p2"));

    renderWithProviders(<ComparePage />, { route: "/compare", store });

    await waitFor(() => {
      expect(screen.getByText("Aether Noise-Cancelling Headphones")).toBeInTheDocument();
      expect(screen.getByText("Kite 13 Ultralight Laptop")).toBeInTheDocument();
    });
  });
});
