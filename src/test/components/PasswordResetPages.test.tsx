import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import i18n from "../../i18n/config";
import { createTestStore } from "../renderWithProviders";
import { authApi } from "../../services/api/authApi";
import { ForgotPasswordPage } from "../../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../../pages/auth/ResetPasswordPage";

function renderAuth(store: ReturnType<typeof createTestStore>, initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: "/auth/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/auth/reset-password", element: <ResetPasswordPage /> },
      { path: "/auth/login", element: <div>Login page</div> },
    ],
    { initialEntries: [initialPath] }
  );
  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>
  );
}

describe("Forgot and reset password pages", () => {
  it("the whole flow through the pages changes the password: new one logs in, old one doesn't", async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const email = `pages-${Date.now()}@example.com`;
    await store.dispatch(authApi.endpoints.register.initiate({ fullName: "Sam", email, password: "oldpass123" }));
    renderAuth(store, "/auth/forgot-password");

    await user.type(await screen.findByLabelText("Email"), email);
    await user.click(screen.getByRole("button", { name: /send/i }));
    await user.click(await screen.findByRole("link", { name: /continue/i }));

    await user.type(await screen.findByLabelText("New password"), "newpass456");
    await user.type(screen.getByLabelText("Confirm new password"), "newpass456");
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByText("Your password has been reset. You can log in now.", undefined, { timeout: 3000 })).toBeInTheDocument();

    expect(await store.dispatch(authApi.endpoints.login.initiate({ email, password: "newpass456" }))).toHaveProperty("data");
    expect(await store.dispatch(authApi.endpoints.login.initiate({ email, password: "oldpass123" }))).toHaveProperty("error");
  }, 20000);

  it("a bad token shows the error instead of 'password reset', and offers a new link", async () => {
    const user = userEvent.setup();
    renderAuth(createTestStore(), "/auth/reset-password?token=bogus");

    await user.type(await screen.findByLabelText("New password"), "newpass456");
    await user.type(screen.getByLabelText("Confirm new password"), "newpass456");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByRole("alert", undefined, { timeout: 3000 })).toHaveTextContent("This reset link is invalid or has expired.");
    expect(screen.queryByText("Your password has been reset. You can log in now.")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("link", { name: "Request a new link" })).toBeInTheDocument());
  }, 10000);
});
