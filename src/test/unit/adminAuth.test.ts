import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import {
  authApi,
  SEEDED_ADMIN_EMAIL,
  SEEDED_ADMIN_PASSWORD,
} from "../../services/api/authApi";
import type { User } from "../../types/user";

function createStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

describe("authApi — seeded demo admin", () => {
  it("logs the seeded admin in with the admin role and no password field", async () => {
    const result = await createStore().dispatch(
      authApi.endpoints.login.initiate({ email: SEEDED_ADMIN_EMAIL, password: SEEDED_ADMIN_PASSWORD })
    );
    const user = (result as { data: User }).data;
    expect(user.role).toBe("admin");
    expect(user).not.toHaveProperty("password");
  });

  it("rejects a wrong password for the admin", async () => {
    const result = await createStore().dispatch(
      authApi.endpoints.login.initiate({ email: SEEDED_ADMIN_EMAIL, password: "nope" })
    );
    expect("error" in result).toBe(true);
  });

  it("gives newly registered users the customer role", async () => {
    const email = `role-${Date.now()}@example.com`;
    const result = await createStore().dispatch(
      authApi.endpoints.register.initiate({ fullName: "Sam Rivera", email, password: "password123" })
    );
    expect((result as { data: User }).data.role).toBe("customer");
  });

  it("does not let anyone register over the admin email", async () => {
    const result = await createStore().dispatch(
      authApi.endpoints.register.initiate({
        fullName: "Impostor",
        email: SEEDED_ADMIN_EMAIL.toUpperCase(),
        password: "password123",
      })
    );
    expect((result as { error: { status: number } }).error.status).toBe(409);
  });
});
