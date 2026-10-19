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

/**
 * SEEDED DEMO ADMIN — MOCK ONLY (Phase 12).
 *
 * A fixed admin account so the /admin area can be exercised without a backend.
 * The credentials are public in this repo and the password is plain text, like
 * every other password in this mock store. A real system must provision admins
 * server-side, hash their credentials, and enforce the role on the backend:
 * the frontend role check (`useAuthGuard({ role })`) is UX only (MASTER_SPEC §97).
 */
export const SEEDED_ADMIN_EMAIL = "admin@nova.demo";
export const SEEDED_ADMIN_PASSWORD = "admin-demo-123";
const SEEDED_ADMIN_ID = "user-admin-seed";

const seededAdmin: MockUserRecord = {
  id: SEEDED_ADMIN_ID,
  fullName: "NOVA Admin",
  email: SEEDED_ADMIN_EMAIL,
  password: SEEDED_ADMIN_PASSWORD,
  role: "admin",
};

function withSeededAdmin(users: MockUserRecord[]): MockUserRecord[] {
  return users.some((u) => u.id === SEEDED_ADMIN_ID) ? users : [seededAdmin, ...users];
}

let userStore: MockUserRecord[] = withSeededAdmin(loadPersisted<MockUserRecord[]>("mockUsers", []));

function persistUsers() {
  savePersisted("mockUsers", userStore);
}

/**
 * PASSWORD-RESET TOKENS — MOCK ONLY.
 *
 * `forgotPassword` issues a one-time token for the email and remembers which email it belongs to, so
 * `resetPassword` can find the account to change. Tokens live in memory only (a page refresh forgets
 * them, like any pending reset in a demo); the new *password* is persisted with the rest of the mock
 * users, so it survives a refresh. A real backend emails the token and never hands it to the browser.
 */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

interface ResetTokenRecord {
  email: string;
  expiresAt: number;
}

const resetTokens = new Map<string, ResetTokenRecord>();

function newResetToken(): string {
  return globalThis.crypto?.randomUUID?.() ?? generateId("reset");
}

function toPublicUser(record: MockUserRecord): User {
  const { password: _password, ...user } = record;
  return user;
}

/** Admin-only mock accessor: registered customer accounts (never includes passwords). */
export function listMockCustomers(): User[] {
  return userStore.filter((u) => (u.role ?? "customer") === "customer").map(toPublicUser);
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
        const record: MockUserRecord = {
          id: generateId("user"),
          fullName,
          email,
          password,
          role: "customer",
        };
        userStore = [...userStore, record];
        persistUsers();
        return { data: await delay(toPublicUser(record), 400) };
      },
    }),
    // Always "succeeds" with the same response shape regardless of whether the email exists — correct
    // for a real backend too (don't leak account existence). A token is remembered only when the email
    // belongs to an account; for an unknown email the returned token simply fails at `resetPassword`.
    // `demoToken` is returned only because this demo has no inbox; a real backend emails it instead.
    forgotPassword: builder.mutation<{ ok: true; demoToken: string }, { email: string }>({
      queryFn: async ({ email }) => {
        const token = newResetToken();
        const record = userStore.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (record) {
          resetTokens.set(token, { email: record.email, expiresAt: Date.now() + RESET_TOKEN_TTL_MS });
        }
        return { data: await delay({ ok: true as const, demoToken: token }, 500) };
      },
    }),
    // Looks the token up, changes that account's password, persists it, and burns the token (one use).
    // An unknown, already-used or expired token is a 400 with one message for all three cases.
    resetPassword: builder.mutation<{ ok: true }, { token: string; newPassword: string }>({
      queryFn: async ({ token, newPassword }) => {
        const entry = resetTokens.get(token);
        resetTokens.delete(token);
        const record = entry && entry.expiresAt > Date.now()
          ? userStore.find((u) => u.email.toLowerCase() === entry.email.toLowerCase())
          : undefined;
        if (!record) {
          return { error: { status: 400, message: "This reset link is invalid or has expired." } };
        }
        userStore = userStore.map((u) => (u.id === record.id ? { ...u, password: newPassword } : u));
        persistUsers();
        return { data: await delay({ ok: true as const }, 500) };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
