import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import { AssistantPage } from "../../pages/assistant/AssistantPage";
import { selectCartLines } from "../../features/cart/cartSlice";
import { selectCompareIds } from "../../features/compare/compareSlice";

describe("AssistantPage", () => {
  it("shows suggested prompts when the conversation is empty", async () => {
    renderWithProviders(<AssistantPage />);
    await waitFor(() => {
      expect(screen.getByText("Find me a laptop under $1000")).toBeInTheDocument();
    });
  });

  it("clicking a suggested prompt sends it and shows the assistant's reply with product cards", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssistantPage />);

    await user.click(await screen.findByText("Find me a laptop under $1000"));

    await waitFor(
      () => {
        expect(screen.getByText("Pulse Mechanical Keyboard")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("typing a message and submitting adds it to the conversation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssistantPage />);

    const input = screen.getByLabelText("Ask NOVA anything…");
    await user.type(input, "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByText("hello")).toBeInTheDocument());
  });

  it("clicking 'Add to cart' on a recommended product actually adds it to the cart", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<AssistantPage />);

    await user.click(await screen.findByText("Find me a laptop under $1000"));
    await waitFor(() => expect(screen.getByText("Pulse Mechanical Keyboard")).toBeInTheDocument(), {
      timeout: 3000,
    });

    const addToCartButtons = screen.getAllByRole("button", { name: /add to cart/i });
    await waitFor(() => expect(addToCartButtons[0]).not.toBeDisabled());
    await user.click(addToCartButtons[0]);

    await waitFor(() => expect(selectCartLines(store.getState()).length).toBeGreaterThan(0));
  });

  it("a comparison request's 'View full comparison' action populates the compare list", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<AssistantPage />);

    const input = screen.getByLabelText("Ask NOVA anything…");
    await user.type(
      input,
      "Compare the Aether Noise-Cancelling Headphones and the Kite 13 Ultralight Laptop"
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    const viewComparisonButton = await screen.findByRole(
      "button",
      { name: /view full comparison/i },
      { timeout: 3000 }
    );
    await user.click(viewComparisonButton);

    await waitFor(() => expect(selectCompareIds(store.getState())).toHaveLength(2));
  });

  it("clearing the conversation empties it and shows suggested prompts again", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssistantPage />);

    const input = screen.getByLabelText("Ask NOVA anything…");
    await user.type(input, "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByText("hello")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Clear conversation" }));
    await waitFor(() => {
      expect(screen.getByText("Find me a laptop under $1000")).toBeInTheDocument();
    });
  });
});
