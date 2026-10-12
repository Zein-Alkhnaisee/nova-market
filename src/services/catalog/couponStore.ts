/**
 * The coupon catalog — one store, shared by checkout and the admin.
 *
 * Third admin-managed store (after products and categories), built on the shared
 * `createVersionedStore` helper (HANDOFF §8 #17). `mocks/data/coupons.ts` is SEED
 * DATA ONLY: checkout's `CouponInput` reads through `findActiveCoupon()`, so a
 * coupon an admin creates, edits, deactivates or deletes takes effect at
 * checkout immediately. Persisted as `nova:coupons:v1`; bad storage falls back
 * to the seed.
 *
 * Rules enforced HERE (not just in the form):
 *   - codes are unique (case-insensitively), stored upper-case, and IMMUTABLE once
 *     created — orders record the code, so renaming one would orphan its usage;
 *   - percent off is a whole number from 1 to 100;
 *   - a coupon that any order has used can't be deleted (409) — deactivate it
 *     instead. Only orders that RECORDED a code can block deletion; orders placed
 *     before `Order.couponCode` existed carry none, so their usage is unknowable.
 *
 * `active` is what lets an admin retire a used coupon without deleting it. Seed
 * coupons are active, so existing checkout behavior is unchanged.
 */
import { createVersionedStore } from "../../lib/versionedStore";
import { generateId } from "../../lib/id";
import { coupons as seedCoupons } from "../../mocks/data/coupons";
import { listAllOrders } from "../api/ordersApi";

const STORAGE_KEY = "coupons:v1";
const STORAGE_VERSION = 1;

export interface StoredCoupon {
  id: string;
  code: string;
  percentOff: number;
  description: string;
  active: boolean;
}

export interface CouponInput {
  /** Create only. Case-insensitive; stored upper-case. */
  code?: string;
  percentOff: number;
  description?: string;
  active?: boolean;
}

export type CouponFieldError = "required" | "tooLong" | "invalidFormat" | "taken" | "invalidPercent";

export type CouponWriteResult =
  | { ok: true; coupon: StoredCoupon }
  | { ok: false; status: 400 | 404 | 409; fields: Partial<Record<string, CouponFieldError>> };

export type CouponDeleteResult =
  | { ok: true; coupon: StoredCoupon }
  | { ok: false; status: 404 }
  | { ok: false; status: 409; reason: "usedInOrders"; orderCount: number };

// An empty list is VALID here (unlike products/categories): an admin may delete
// every coupon, and that must not resurrect the seed on the next load.
function isValidStored(value: unknown): value is StoredCoupon[] {
  return (
    Array.isArray(value) &&
    value.every(
      (c) =>
        c !== null &&
        typeof c === "object" &&
        typeof (c as StoredCoupon).id === "string" &&
        typeof (c as StoredCoupon).code === "string" &&
        typeof (c as StoredCoupon).percentOff === "number" &&
        Number.isFinite((c as StoredCoupon).percentOff) &&
        typeof (c as StoredCoupon).description === "string" &&
        typeof (c as StoredCoupon).active === "boolean"
    )
  );
}

const store = createVersionedStore<StoredCoupon>({
  key: STORAGE_KEY,
  version: STORAGE_VERSION,
  seed: () =>
    seedCoupons.map((c) => ({
      id: `coupon-${c.code.toLowerCase()}`,
      code: c.code,
      percentOff: c.percentOff,
      description: c.description,
      active: true,
    })),
  isValid: isValidStored,
});
const items = () => store.read();
const commit = (next: StoredCoupon[]) => store.write(next);

export function listCoupons(): StoredCoupon[] {
  return [...items()];
}

export function getCouponById(id: string): StoredCoupon | undefined {
  return items().find((c) => c.id === id);
}

/** What checkout uses: case-insensitive, and only coupons that are switched on. */
export function findActiveCoupon(code: string): StoredCoupon | undefined {
  const needle = code.trim().toLowerCase();
  return needle ? items().find((c) => c.active && c.code.toLowerCase() === needle) : undefined;
}

/** Orders that recorded this coupon code (case-insensitive). */
export function countOrdersUsingCoupon(code: string): number {
  const needle = code.toLowerCase();
  return listAllOrders().filter((o) => o.couponCode?.toLowerCase() === needle).length;
}

/** Test/dev helper: forget in-memory state and stored edits; the next read re-seeds. */
export function resetStore(): void {
  store.reset();
}

function validateShared(input: CouponInput) {
  const fields: Partial<Record<string, CouponFieldError>> = {};
  if (typeof input.percentOff !== "number" || Number.isNaN(input.percentOff)) fields.percentOff = "required";
  else if (!Number.isInteger(input.percentOff) || input.percentOff < 1 || input.percentOff > 100) {
    fields.percentOff = "invalidPercent";
  }
  const description = input.description?.trim() ?? "";
  if (description.length > 120) fields.description = "tooLong";
  return { fields, description };
}

const failure = (fields: Partial<Record<string, CouponFieldError>>): CouponWriteResult => ({
  ok: false,
  status: Object.keys(fields).length === 1 && fields.code === "taken" ? 409 : 400,
  fields,
});

export function createCoupon(input: CouponInput): CouponWriteResult {
  const { fields, description } = validateShared(input);
  const raw = input.code?.trim() ?? "";
  if (!raw) fields.code = "required";
  else if (!/^[A-Za-z0-9_-]{3,32}$/.test(raw)) fields.code = raw.length > 32 ? "tooLong" : "invalidFormat";
  else if (items().some((c) => c.code.toLowerCase() === raw.toLowerCase())) fields.code = "taken";
  if (Object.keys(fields).length > 0) return failure(fields);

  const coupon: StoredCoupon = {
    id: generateId("coupon"),
    code: raw.toUpperCase(),
    percentOff: input.percentOff,
    description,
    active: input.active ?? true,
  };
  commit([...items(), coupon]);
  return { ok: true, coupon };
}

/** Percent, description and active only — the code never changes. */
export function updateCoupon(id: string, input: Omit<CouponInput, "code">): CouponWriteResult {
  const existing = items().find((c) => c.id === id);
  if (!existing) return { ok: false, status: 404, fields: {} };
  const { fields, description } = validateShared(input);
  if (Object.keys(fields).length > 0) return failure(fields);

  const coupon: StoredCoupon = {
    ...existing,
    percentOff: input.percentOff,
    description,
    active: input.active ?? existing.active,
  };
  commit(items().map((c) => (c.id === id ? coupon : c)));
  return { ok: true, coupon };
}

export function deleteCoupon(id: string): CouponDeleteResult {
  const existing = items().find((c) => c.id === id);
  if (!existing) return { ok: false, status: 404 };
  const orderCount = countOrdersUsingCoupon(existing.code);
  if (orderCount > 0) return { ok: false, status: 409, reason: "usedInOrders", orderCount };
  commit(items().filter((c) => c.id !== id));
  return { ok: true, coupon: existing };
}
