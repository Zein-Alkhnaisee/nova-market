import { baseApi } from "./baseApi";
import { delay } from "../../lib/delay";
import { loadPersisted, savePersisted } from "../../lib/persist";
import { generateId } from "../../lib/id";
import type { User } from "../../types/user";

/**
 * MOCK AUTH BACKEND — for demo purposes only.
 *
 * Real authentication is explicitly out of scope for a frontend-only demo
 * (MASTER_SPEC §29: "Never fake successful payment/authentication in a way
 * that implies production security"). This module simulates the *shape* of
 * an auth API (login/register/forgot/reset all as async mutations with
 * realistic latency and error cases) so the rest of the app — Redux state,
 * route guards, the account section — is architected exactly as it would be
 * against a real backend. Swapping this file for real HTTP calls to a real
 * auth service should require no changes anywhere else.
 *
 * Passwords are kept only in this in-memory/localStorage mock store, in
 * plain text, which a real backend must never do (hash + salt server-side).
 * This is called out here, not hidden, precisely so it's obvious this file
 * is the boundary that needs replacing.
 */

interface MockUserRecord extends User {
  password: string;
}

let userStore: MockUserRecord[] = loadPersisted<MockUserRecord[]>("mockUsers", []);

function persistUsers() {
  savePersisted("mockUsers", userStore);
}

function toPublicUser(record: MockUserRecord): User {
  const { password: _password, ...user } = record;
  return user;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<User, LoginInput>({
      queryFn: async ({ email, password }) => {
        const record = userStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!record || record.password !== password) {
          return { error: { status: 401, message: "Incorrect email or password." } };
        }
        return { data: await delay(toPublicUser(record), 400) };
      },
    }),
    register: builder.mutation<User, RegisterInput>({
      queryFn: async ({ fullName, email, password }) => {
        const exists = userStore.some((u) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          return { error: { status: 409, message: "An account with that email already exists." } };
        }
        const record: MockUserRecord = { id: generateId("user"), fullName, email, password };
        userStore = [...userStore, record];
        persistUsers();
        return { data: await delay(toPublicUser(record), 400) };
      },
    }),
    // Always "succeeds" regardless of whether the email exists — this is
    // correct behavior for a real backend too (don't leak account existence).
    forgotPassword: builder.mutation<{ ok: true }, { email: string }>({
      queryFn: async () => ({ data: await delay({ ok: true as const }, 500) }),
    }),
    // Demo accepts any token — a real backend validates a signed, expiring token.
    resetPassword: builder.mutation<{ ok: true }, { token: string; newPassword: string }>({
      queryFn: async () => ({ data: await delay({ ok: true as const }, 500) }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
