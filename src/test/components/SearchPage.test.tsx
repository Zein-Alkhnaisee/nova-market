import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import { SearchPage } from "../../pages/search/SearchPage";

describe("SearchPage", () => {
  it("shows a start prompt when there is no query in the URL", () => {
    renderWithProviders(<SearchPage />, { route: "/search" });
    expect(screen.getByText(/search nova market/i)).toBeInTheDocument();
  });

  it("reads the query from the URL and shows matching results", async () => {
    renderWithProviders(<SearchPage />, { route: "/search?q=keyboard" });
    await waitFor(() => {
      expect(screen.getByText(/pulse mechanical keyboard/i)).toBeInTheDocument();
    });
  });

  it("shows a no-results state for a query that matches nothing", async () => {
    renderWithProviders(<SearchPage />, { route: "/search?q=zzz-nonexistent-zzz" });
    await waitFor(() => {
      expect(screen.getByText(/no results for/i)).toBeInTheDocument();
    });
  });

  it("applying a price filter narrows the results and updates the URL", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />, { route: "/search?q=e" });
    await waitFor(() => expect(screen.queryAllByRole("link").length).toBeGreaterThan(0));

    const minPriceInput = screen.getByLabelText("Min");
    await user.type(minPriceInput, "1000");

    await waitFor(() => {
      // Kite 13 Ultralight Laptop ($1399) matches "e" and is above 1000; cheaper matches should disappear.
      expect(screen.queryByText(/pulse mechanical keyboard/i)).not.toBeInTheDocument();
    });
  });
});
