import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import i18n from "../../i18n/config";
import { createTestStore } from "../renderWithProviders";
import { LoginPage } from "../../pages/auth/LoginPage";
import { RegisterPage } from "../../pages/auth/RegisterPage";
import { AccountOverviewPage } from "../../pages/account/AccountOverviewPage";
import { selectIsAuthenticated } from "../../features/auth/authSlice";

function renderAuth(
  store: ReturnType<typeof createTestStore>,
  initialPath: string
) {
  const router = createMemoryRouter(
    [
      { path: "/auth/login", element: <LoginPage /> },
      { path: "/auth/register", element: <RegisterPage /> },
      { path: "/account", element: <AccountOverviewPage /> },
    ],
    { initialEntries: [initialPath] }
  );
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>
  );
}

describe("Auth pages", () => {
  it("registering creates a session and lands on the account overview", async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderAuth(store, "/auth/register");

    await waitFor(() => expect(screen.getByText("Create your account")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Full name"), "Jordan Lee");
    await user.type(screen.getByLabelText("Email"), `jordan-${Date.now()}@example.com`);
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(selectIsAuthenticated(store.getState())).toBe(true));
  }, 10000);

  it("shows a validation error when passwords don't match", async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderAuth(store, "/auth/register");

    await waitFor(() => expect(screen.getByText("Create your account")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Full name"), "Jordan Lee");
    await user.type(screen.getByLabelText("Email"), "jordan@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "different456");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
    expect(selectIsAuthenticated(store.getState())).toBe(false);
  }, 10000);

  it("shows an error for incorrect login credentials", async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderAuth(store, "/auth/login");

    await waitFor(() => expect(screen.getByText("Welcome back")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Email"), "nobody@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(selectIsAuthenticated(store.getState())).toBe(false);
  }, 10000);

  it("redirects an unauthenticated visitor away from the account overview to login", async () => {
    const store = createTestStore();
    renderAuth(store, "/account");
    await waitFor(() => expect(screen.getByText("Welcome back")).toBeInTheDocument());
  });
});
