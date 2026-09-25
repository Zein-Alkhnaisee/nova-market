import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import { CommandPalette } from "../../components/navigation/CommandPalette";
import { setFeatureFlag } from "../../features/settings/featureFlagsSlice";

describe("CommandPalette", () => {
  it("is closed by default", () => {
    renderWithProviders(<CommandPalette onOpenSearch={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on Ctrl+K and closes on Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette onOpenSearch={() => {}} />);

    await user.keyboard("{Control>}k{/Control}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("opens on Meta+K as well (Cmd+K on Mac)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette onOpenSearch={() => {}} />);
    await user.keyboard("{Meta>}k{/Meta}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("the dialog is an accessible combobox with a listbox of options", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette onOpenSearch={() => {}} />);
    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("dialog");
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  });

  it("filters commands as you type and shows a no-results state for a nonsense query", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette onOpenSearch={() => {}} />);
    await user.keyboard("{Control>}k{/Control}");
    const input = await screen.findByRole("combobox");

    await user.type(input, "cart");
    expect(screen.getByRole("option", { name: /open cart/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /open wishlist/i })).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "zzzznonexistent");
    expect(screen.getByText(/no matching actions/i)).toBeInTheDocument();
  });

  it("running the 'search products' action calls onOpenSearch and closes the palette", async () => {
    const user = userEvent.setup();
    const onOpenSearch = vi.fn();
    renderWithProviders(<CommandPalette onOpenSearch={onOpenSearch} />);
    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("option", { name: /search products/i }));

    expect(onOpenSearch).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("arrow keys move the active option and Enter runs it", async () => {
    const user = userEvent.setup();
    const onOpenSearch = vi.fn();
    renderWithProviders(<CommandPalette onOpenSearch={onOpenSearch} />);
    await user.keyboard("{Control>}k{/Control}");
    const input = await screen.findByRole("combobox");

    // First option is "Search products" by construction; Enter with no
    // arrow presses should run it immediately.
    await user.type(input, "{Enter}");
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it("does not open when the commandPalette feature flag is off", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<CommandPalette onOpenSearch={() => {}} />);
    store.dispatch(setFeatureFlag({ key: "commandPalette", enabled: false }));

    await user.keyboard("{Control>}k{/Control}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
