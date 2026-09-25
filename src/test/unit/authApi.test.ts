import { describe, expect, it, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { authApi } from "../../services/api/authApi";
import type { User } from "../../types/user";

function createTestStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

let counter = 0;
function uniqueEmail() {
  counter += 1;
  return `user${counter}-${Date.now()}@example.com`;
}

describe("authApi", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it("registers a new user and returns them without a password field", async () => {
    const email = uniqueEmail();
    const result = await store.dispatch(
      authApi.endpoints.register.initiate({ fullName: "Jordan Lee", email, password: "password123" })
    );
    expect("data" in result).toBe(true);
    const user = (result as { data: User }).data;
    expect(user.email).toBe(email);
    expect(user).not.toHaveProperty("password");
  });

  it("rejects registering an email that already exists", async () => {
    const email = uniqueEmail();
    await store.dispatch(
      authApi.endpoints.register.initiate({ fullName: "First", email, password: "password123" })
    );
    const result = await store.dispatch(
      authApi.endpoints.register.initiate({ fullName: "Second", email, password: "password123" })
    );
    expect("error" in result).toBe(true);
  });

  it("logs in with correct credentials", async () => {
    const email = uniqueEmail();
    await store.dispatch(
      authApi.endpoints.register.initiate({ fullName: "Jordan Lee", email, password: "password123" })
    );
    const result = await store.dispatch(
      authApi.endpoints.login.initiate({ email, password: "password123" })
    );
    expect("data" in result).toBe(true);
    expect((result as { data: User }).data.fullName).toBe("Jordan Lee");
  });

  it("rejects login with the wrong password", async () => {
    const email = uniqueEmail();
    await store.dispatch(
      authApi.endpoints.register.initiate({ fullName: "Jordan Lee", email, password: "password123" })
    );
    const result = await store.dispatch(
      authApi.endpoints.login.initiate({ email, password: "wrong-password" })
    );
    expect("error" in result).toBe(true);
  });

  it("rejects login for an unknown email", async () => {
    const result = await store.dispatch(
      authApi.endpoints.login.initiate({ email: "nobody@example.com", password: "whatever" })
    );
    expect("error" in result).toBe(true);
  });

  it("matches email case-insensitively on login", async () => {
    const email = uniqueEmail();
    await store.dispatch(
      authApi.endpoints.register.initiate({ fullName: "Jordan Lee", email, password: "password123" })
    );
    const result = await store.dispatch(
      authApi.endpoints.login.initiate({ email: email.toUpperCase(), password: "password123" })
    );
    expect("data" in result).toBe(true);
  });

  it("forgotPassword succeeds regardless of whether the account exists (no account enumeration)", async () => {
    const result = await store.dispatch(
      authApi.endpoints.forgotPassword.initiate({ email: "definitely-not-a-user@example.com" })
    );
    expect("data" in result).toBe(true);
  });
});
