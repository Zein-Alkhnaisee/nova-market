import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestStore } from "../renderWithProviders";
import { setFeatureFlag } from "../../features/settings/featureFlagsSlice";
import { FloatingAssistant } from "../../components/layout/FloatingAssistant";

describe("FloatingAssistant", () => {
  it("shows the floating button on an ordinary route", () => {
    renderWithProviders(<FloatingAssistant />, { route: "/shop" });
    expect(screen.getByRole("button", { name: "Open assistant" })).toBeInTheDocument();
  });

  it("hides on checkout routes to preserve the distraction-free layout", () => {
    renderWithProviders(<FloatingAssistant />, { route: "/checkout/shipping" });
    expect(screen.queryByRole("button", { name: "Open assistant" })).not.toBeInTheDocument();
  });

  it("hides on auth routes", () => {
    renderWithProviders(<FloatingAssistant />, { route: "/auth/login" });
    expect(screen.queryByRole("button", { name: "Open assistant" })).not.toBeInTheDocument();
  });

  it("hides on the dedicated assistant page itself (no redundant floating button)", () => {
    renderWithProviders(<FloatingAssistant />, { route: "/assistant" });
    expect(screen.queryByRole("button", { name: "Open assistant" })).not.toBeInTheDocument();
  });

  it("hides entirely when the aiAssistant flag is off", () => {
    const store = createTestStore();
    store.dispatch(setFeatureFlag({ key: "aiAssistant", enabled: false }));
    renderWithProviders(<FloatingAssistant />, { route: "/shop", store });
    expect(screen.queryByRole("button", { name: "Open assistant" })).not.toBeInTheDocument();
  });

  it("opens the panel on click and closes it again", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FloatingAssistant />, { route: "/shop" });

    await user.click(screen.getByRole("button", { name: "Open assistant" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
