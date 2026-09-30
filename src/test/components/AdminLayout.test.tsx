import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { setSession } from "../../features/auth/authSlice";
import { createTestStore, renderWithProviders } from "../renderWithProviders";
import type { User } from "../../types/user";

const admin: User = { id: "a1", fullName: "Ada Admin", email: "ada@example.com", role: "admin" };
const customer: User = { id: "c1", fullName: "Cam Customer", email: "cam@example.com", role: "customer" };
const legacySession: User = { id: "l1", fullName: "Old Session", email: "old@example.com" };

function AdminApp() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <AdminLayout>
            <p>admin content</p>
          </AdminLayout>
        }
      />
      <Route path="/auth/login" element={<p>login page</p>} />
      <Route path="/account" element={<p>account page</p>} />
      <Route path="/" element={<p>storefront</p>} />
    </Routes>
  );
}

function setup(user: User | null) {
  const store = createTestStore();
  if (user) store.dispatch(setSession(user));
  return renderWithProviders(<AdminApp />, { route: "/admin", store });
}

describe("AdminLayout access control", () => {
  it("redirects a signed-out visitor to login", async () => {
    setup(null);
    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });

  it("shows a no-access state to a customer, without redirecting or leaking content", () => {
    setup(customer);
    expect(screen.getByRole("heading", { name: /don't have access/i })).toBeInTheDocument();
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });

  it("treats a session with no role (persisted before Phase 12) as a customer", () => {
    setup(legacySession);
    expect(screen.getByRole("heading", { name: /don't have access/i })).toBeInTheDocument();
  });

  it("lets a customer switch accounts, which signs them out and goes to login", async () => {
    const { store } = setup(customer);
    await userEvent.click(screen.getByRole("button", { name: /different account/i }));
    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(store.getState().auth.user).toBeNull();
  });

  it("renders the admin shell and content for an admin", () => {
    setup(admin);
    expect(screen.getByText("admin content")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: /admin sections/i });
    for (const name of ["Dashboard", "Products", "Categories", "Orders", "Customers", "Coupons", "Analytics"]) {
      expect(nav).toHaveTextContent(name);
    }
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  });

  it("signs an admin out and returns to the storefront", async () => {
    const { store } = setup(admin);
    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(await screen.findByText("storefront")).toBeInTheDocument();
    expect(store.getState().auth.user).toBeNull();
  });
});
