import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestStore } from "../renderWithProviders";
import { setSession } from "../../features/auth/authSlice";
import { SettingsPage } from "../../pages/account/SettingsPage";
import { selectFeatureFlag } from "../../features/settings/featureFlagsSlice";

function authenticatedStore() {
  const store = createTestStore();
  store.dispatch(setSession({ id: "u1", fullName: "Jordan Lee", email: "jordan@example.com" }));
  return store;
}

describe("SettingsPage — experimental feature toggles", () => {
  it("lists a toggle for every feature flag, checked by default", async () => {
    const store = authenticatedStore();
    renderWithProviders(<SettingsPage />, { route: "/account/settings", store });

    await waitFor(() => expect(screen.getByText("Experimental features")).toBeInTheDocument());
    expect(screen.getByRole("checkbox", { name: "Product comparison" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /command palette/i })).toBeChecked();
  });

  it("unchecking a toggle updates the underlying feature flag state", async () => {
    const user = userEvent.setup();
    const store = authenticatedStore();
    renderWithProviders(<SettingsPage />, { route: "/account/settings", store });

    await waitFor(() => expect(screen.getByText("Experimental features")).toBeInTheDocument());
    const configuratorToggle = screen.getByRole("checkbox", { name: "Product configurator" });
    expect(configuratorToggle).toBeChecked();

    await user.click(configuratorToggle);

    expect(configuratorToggle).not.toBeChecked();
    expect(selectFeatureFlag("productConfigurator")(store.getState())).toBe(false);
  });

  it("re-checking a toggle turns the flag back on", async () => {
    const user = userEvent.setup();
    const store = authenticatedStore();
    renderWithProviders(<SettingsPage />, { route: "/account/settings", store });

    await waitFor(() => expect(screen.getByText("Experimental features")).toBeInTheDocument());
    const smartRecToggle = screen.getByRole("checkbox", { name: /smart recommendations/i });

    await user.click(smartRecToggle);
    expect(selectFeatureFlag("smartRecommendations")(store.getState())).toBe(false);

    await user.click(smartRecToggle);
    expect(selectFeatureFlag("smartRecommendations")(store.getState())).toBe(true);
  });
});
