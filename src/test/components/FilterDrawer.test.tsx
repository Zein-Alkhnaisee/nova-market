import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n/config";
import { FilterDrawer } from "../../components/product/FilterDrawer";

function Harness() {
  const [open, setOpen] = useState(false);
  const [edits, setEdits] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open filters
      </button>
      <p>edits: {edits}</p>
      {open ? (
        // A fresh onClose on every parent render, exactly like the real pages create.
        <FilterDrawer title="Filters" onClose={() => setOpen(false)}>
          <input aria-label="Minimum price" onChange={() => setEdits((n) => n + 1)} />
        </FilterDrawer>
      ) : null}
    </div>
  );
}

describe("FilterDrawer (mobile filters dialog)", () => {
  it("is a labelled modal dialog and moves focus into itself when it opens", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open filters" }));

    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveFocus();
  });

  it("closes on Escape and gives focus back to the control that opened it", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open filters" });
    await user.click(opener);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("closes from the close button and from the backdrop", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open filters" }));
    const closers = screen.getAllByRole("button", { name: "Close" });
    expect(closers).toHaveLength(2); // backdrop + the X button
    await user.click(closers[1]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open filters" }));
    await user.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not steal focus from a field while the parent re-renders on every keystroke", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open filters" }));

    const input = screen.getByRole("textbox", { name: "Minimum price" });
    await user.type(input, "250");

    expect(input).toHaveValue("250");
    expect(input).toHaveFocus();
    expect(screen.getByText("edits: 3")).toBeInTheDocument();
  });
});
