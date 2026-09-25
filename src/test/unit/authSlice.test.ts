import { describe, expect, it } from "vitest";
import authReducer, {
  setSession,
  updateProfile,
  clearSession,
  selectIsAuthenticated,
  selectUser,
} from "../../features/auth/authSlice";

const user = { id: "u1", fullName: "Jordan Lee", email: "jordan@example.com" };

describe("authSlice", () => {
  it("starts unauthenticated", () => {
    const state = authReducer(undefined, { type: "@@init" });
    expect(selectIsAuthenticated({ auth: state })).toBe(false);
  });

  it("stores a session on login", () => {
    const state = authReducer(undefined, setSession(user));
    expect(selectUser({ auth: state })).toEqual(user);
    expect(selectIsAuthenticated({ auth: state })).toBe(true);
  });

  it("updates profile fields without losing the id", () => {
    let state = authReducer(undefined, setSession(user));
    state = authReducer(state, updateProfile({ fullName: "Jordan Smith" }));
    expect(state.user?.fullName).toBe("Jordan Smith");
    expect(state.user?.id).toBe("u1");
    expect(state.user?.email).toBe("jordan@example.com");
  });

  it("ignores profile updates when logged out", () => {
    const state = authReducer(undefined, updateProfile({ fullName: "Nobody" }));
    expect(state.user).toBeNull();
  });

  it("clears the session on logout", () => {
    let state = authReducer(undefined, setSession(user));
    state = authReducer(state, clearSession());
    expect(selectIsAuthenticated({ auth: state })).toBe(false);
  });
});
