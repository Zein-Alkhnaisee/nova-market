import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import "../../i18n/config";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { RouteBoundary } from "../../components/common/RouteBoundary";

const SECRET = "secret internal detail";

function Bomb(): ReactElement {
  throw new Error(SECRET);
}

let consoleError: MockInstance;

beforeEach(() => {
  // React and the boundary both log a caught render error; keep the test output readable.
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe("ErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("all good")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("replaces a crashed subtree with a designed page that has Reload and Go home", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });

  it("never shows the raw error to the person (MASTER_SPEC §46)", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.queryByText(new RegExp(SECRET))).not.toBeInTheDocument();
  });

  it("logs the error for developers", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(consoleError).toHaveBeenCalledWith(
      "[ErrorBoundary] caught a render error",
      expect.any(Error),
      expect.any(String)
    );
  });

  it("fills the viewport only when asked (app level) and otherwise sits inside the page", () => {
    const { unmount } = render(
      <ErrorBoundary fullPage>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toHaveClass("min-h-screen");
    unmount();

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).not.toHaveClass("min-h-screen");
  });

  it("clears itself and re-renders its children when resetKey changes", () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="a">
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKey="b">
        <p>recovered</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("recovered")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stays on the crash page when only the children change but resetKey does not", () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="a">
        <Bomb />
      </ErrorBoundary>
    );
    rerender(
      <ErrorBoundary resetKey="a">
        <p>still the same page</p>
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("still the same page")).not.toBeInTheDocument();
  });
});

describe("RouteBoundary", () => {
  function Harness() {
    return (
      <MemoryRouter initialEntries={["/boom"]}>
        <nav>
          <Link to="/ok">go to a working page</Link>
        </nav>
        <RouteBoundary>
          <Routes>
            <Route path="/boom" element={<Bomb />} />
            <Route path="/ok" element={<p>a working page</p>} />
          </Routes>
        </RouteBoundary>
      </MemoryRouter>
    );
  }

  it("keeps the surrounding shell usable when only the page crashes, and recovers on navigation", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    // The shell (here, the nav link) is outside the boundary and still works.
    await user.click(screen.getByRole("link", { name: "go to a working page" }));

    expect(screen.getByText("a working page")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
