import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestStore } from "../renderWithProviders";
import { authApi, RESET_TOKEN_TTL_MS } from "../../services/api/authApi";

// The mock auth backend's forgot -> reset flow: a token is tied to an email, changes that account's
// password (persisted), and works once.

type Store = ReturnType<typeof createTestStore>;

let counter = 0;
const uniqueEmail = () => `reset-${Date.now()}-${++counter}@example.com`;

async function registered(store: Store, password = "oldpass123") {
  const email = uniqueEmail();
  await store.dispatch(authApi.endpoints.register.initiate({ fullName: "Sam", email, password }));
  return email;
}
const forgot = (store: Store, email: string) => store.dispatch(authApi.endpoints.forgotPassword.initiate({ email }));
const reset = (store: Store, token: string, newPassword: string) =>
  store.dispatch(authApi.endpoints.resetPassword.initiate({ token, newPassword }));
const login = (store: Store, email: string, password: string) =>
  store.dispatch(authApi.endpoints.login.initiate({ email, password }));

async function tokenFor(store: Store, email: string) {
  const res = await forgot(store, email);
  if (!("data" in res) || !res.data) throw new Error("forgotPassword failed");
  return res.data.demoToken;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("password reset", () => {
  it("register -> forgot -> reset -> the new password logs in", async () => {
    const store = createTestStore();
    const email = await registered(store);
    const token = await tokenFor(store, email);

    const result = await reset(store, token, "newpass456");
    expect(result).toHaveProperty("data");

    const loginNew = await login(store, email, "newpass456");
    expect(loginNew).toHaveProperty("data");
  }, 15000);

  it("the old password no longer works after a reset", async () => {
    const store = createTestStore();
    const email = await registered(store, "oldpass123");
    await reset(store, await tokenFor(store, email), "newpass456");

    const loginOld = await login(store, email, "oldpass123");
    expect(loginOld).toHaveProperty("error");
  }, 15000);

  it("a token can be used only once", async () => {
    const store = createTestStore();
    const email = await registered(store);
    const token = await tokenFor(store, email);

    expect(await reset(store, token, "newpass456")).toHaveProperty("data");
    const second = await reset(store, token, "another789");
    expect(second).toHaveProperty("error");

    // The second attempt changed nothing.
    expect(await login(store, email, "newpass456")).toHaveProperty("data");
    expect(await login(store, email, "another789")).toHaveProperty("error");
  }, 15000);

  it("an invalid token returns a clear error and changes no password", async () => {
    const store = createTestStore();
    const email = await registered(store);

    const result = await reset(store, "not-a-real-token", "newpass456");
    expect(result).toHaveProperty("error");
    expect((result as { error: { message: string } }).error.message).toBe("This reset link is invalid or has expired.");
    expect(await login(store, email, "oldpass123")).toHaveProperty("data");
  }, 15000);

  it("an expired token is rejected", async () => {
    const store = createTestStore();
    const email = await registered(store);
    const token = await tokenFor(store, email);

    const realNow = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(realNow + RESET_TOKEN_TTL_MS + 1000);
    const result = await reset(store, token, "newpass456");
    vi.restoreAllMocks();

    expect(result).toHaveProperty("error");
    expect(await login(store, email, "oldpass123")).toHaveProperty("data");
  }, 15000);

  it("forgot always succeeds in the same shape, even for an email with no account; its token is useless", async () => {
    const store = createTestStore();
    const real = await forgot(store, await registered(store));
    const unknown = await forgot(store, "nobody-here@example.com");

    expect(unknown).toHaveProperty("data");
    expect(Object.keys((unknown as { data: object }).data).sort()).toEqual(
      Object.keys((real as { data: object }).data).sort()
    );
    const token = (unknown as { data: { demoToken: string } }).data.demoToken;
    expect(await reset(store, token, "newpass456")).toHaveProperty("error");
  }, 15000);

  it("persists the new password with the other mock users, and never stores the token", async () => {
    const store = createTestStore();
    const email = await registered(store, "persist-old-pass-9");
    const token = await tokenFor(store, email);
    await reset(store, token, "persisted-pass-1");

    const stored = window.localStorage.getItem("nova:mockUsers") ?? "";
    expect(stored).toContain("persisted-pass-1");
    expect(stored).not.toContain("persist-old-pass-9");
    expect(stored).not.toContain(token);
  }, 15000);

  it("matches the email case-insensitively", async () => {
    const store = createTestStore();
    const email = await registered(store);
    const token = await tokenFor(store, email.toUpperCase());
    expect(await reset(store, token, "newpass456")).toHaveProperty("data");
    expect(await login(store, email, "newpass456")).toHaveProperty("data");
  }, 15000);
});
