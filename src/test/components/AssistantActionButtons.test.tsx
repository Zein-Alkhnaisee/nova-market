import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import { AssistantActionButtons } from "../../components/assistant/AssistantActionButtons";
import { selectCartLines } from "../../features/cart/cartSlice";
import { selectCompareIds } from "../../features/compare/compareSlice";
import type { AssistantAction } from "../../types/assistant";

describe("AssistantActionButtons", () => {
  it("disables 'Add to cart' until the product catalog has finished loading, then enables it", async () => {
    // Regression test: the button used to render enabled immediately and
    // silently no-op if clicked before the underlying product fetch
    // resolved, since add_to_cart needs the full product object, not just
    // an id, to dispatch cartSlice.addToCart.
    const user = userEvent.setup();
    const action: AssistantAction = { id: "a1", type: "add_to_cart", label: "Add to cart", payload: "p3" };
    const { store } = renderWithProviders(<AssistantActionButtons actions={[action]} />);

    const button = screen.getByRole("button", { name: /add to cart/i });
    expect(button).toBeDisabled();

    await waitFor(() => expect(button).not.toBeDisabled());
    await user.click(button);

    await waitFor(() => expect(selectCartLines(store.getState())).toHaveLength(1));
  });

  it("add_to_compare does not depend on the product fetch and works immediately", async () => {
    const user = userEvent.setup();
    const action: AssistantAction = { id: "a1", type: "add_to_compare", label: "Compare", payload: "p3" };
    const { store } = renderWithProviders(<AssistantActionButtons actions={[action]} />);

    const button = screen.getByRole("button", { name: /compare/i });
    expect(button).not.toBeDisabled();
    await user.click(button);

    expect(selectCompareIds(store.getState())).toContain("p3");
  });
});
