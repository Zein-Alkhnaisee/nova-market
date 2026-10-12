import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { ordersApi, type PlaceOrderInput } from "../../services/api/ordersApi";
import {
  countOrdersUsingCoupon,
  createCoupon,
  deleteCoupon,
  findActiveCoupon,
  getCouponById,
  listCoupons,
  resetStore,
  updateCoupon,
  type CouponInput,
} from "../../services/catalog/couponStore";
import { coupons as seed } from "../../mocks/data/coupons";

const KEY = "nova:coupons:v1";
const fail = (r: ReturnType<typeof createCoupon>) => {
  if (r.ok) throw new Error("expected a failure");
  return r;
};
const createStore = () =>
  configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
const orderInput = (couponCode?: string): PlaceOrderInput => ({
  lines: [{ productId: "p1", slug: "p1", name: "Widget", image: "i.jpg", price: 50, currency: "USD", quantity: 1 }],
  shippingAddress: { fullName: "Jo", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" },
  deliveryOption: { id: "s", label: "S", etaDays: "5", price: 0 },
  discountPercent: couponCode ? 10 : 0,
  paymentSummary: { brand: "Visa", last4: "4242" },
  couponCode,
});

describe("couponStore", () => {
  beforeEach(() => resetStore());

  describe("seed — existing checkout behavior is unchanged", () => {
    it("serves the two existing coupons as active, without writing storage", () => {
      expect(listCoupons().map((c) => [c.code, c.percentOff, c.active])).toEqual(
        seed.map((c) => [c.code, c.percentOff, true])
      );
      expect(window.localStorage.getItem(KEY)).toBeNull();
    });

    it("finds seed coupons case-insensitively and ignores surrounding spaces, exactly as the old lookup did", () => {
      expect(findActiveCoupon("save10")?.percentOff).toBe(10);
      expect(findActiveCoupon("  WeLcOmE15 ")?.percentOff).toBe(15);
      expect(findActiveCoupon("nope")).toBeUndefined();
      expect(findActiveCoupon("   ")).toBeUndefined();
    });

    it("never mutates the static seed data", () => {
      const before = JSON.stringify(seed);
      createCoupon({ code: "extra", percentOff: 5 });
      updateCoupon(listCoupons()[0].id, { percentOff: 99, active: false });
      deleteCoupon(listCoupons()[1].id);
      expect(JSON.stringify(seed)).toBe(before);
    });

    it("resetStore restores the seed and forgets edits", () => {
      createCoupon({ code: "extra", percentOff: 5 });
      resetStore();
      expect(window.localStorage.getItem(KEY)).toBeNull();
      expect(listCoupons()).toHaveLength(seed.length);
    });
  });

  describe("create", () => {
    it("stores the code upper-cased, defaults to active, generates an id, persists under the versioned key", () => {
      const r = createCoupon({ code: "summer20", percentOff: 20, description: " Summer sale " });
      if (!r.ok) throw new Error("create failed");
      expect(r.coupon).toMatchObject({ code: "SUMMER20", percentOff: 20, description: "Summer sale", active: true });
      expect(r.coupon.id).toMatch(/^coupon-/);
      const stored = JSON.parse(window.localStorage.getItem(KEY)!);
      expect(stored.version).toBe(1);
      expect(stored.items).toHaveLength(seed.length + 1);
    });

    it("is immediately usable at checkout, in any case", () => {
      createCoupon({ code: "summer20", percentOff: 20 });
      expect(findActiveCoupon("Summer20")).toMatchObject({ code: "SUMMER20", percentOff: 20 });
    });

    it("can be created inactive, and then checkout rejects it", () => {
      createCoupon({ code: "later", percentOff: 5, active: false });
      expect(findActiveCoupon("later")).toBeUndefined();
    });

    it("survives a reload", async () => {
      createCoupon({ code: "summer20", percentOff: 20 });
      vi.resetModules();
      const fresh = await import("../../services/catalog/couponStore");
      expect(fresh.findActiveCoupon("SUMMER20")?.percentOff).toBe(20);
    });

    it.each([
      ["a missing code", { code: "" }, "code", "required"],
      ["a too-short code", { code: "ab" }, "code", "invalidFormat"],
      ["a code with spaces", { code: "SAVE 20" }, "code", "invalidFormat"],
      ["a code with symbols", { code: "SAVE%20" }, "code", "invalidFormat"],
      ["an over-long code", { code: "A".repeat(33) }, "code", "tooLong"],
      ["a missing percent", { percentOff: NaN }, "percentOff", "required"],
      ["a zero percent", { percentOff: 0 }, "percentOff", "invalidPercent"],
      ["a negative percent", { percentOff: -5 }, "percentOff", "invalidPercent"],
      ["a percent over 100", { percentOff: 101 }, "percentOff", "invalidPercent"],
      ["a fractional percent", { percentOff: 12.5 }, "percentOff", "invalidPercent"],
      ["an over-long description", { description: "x".repeat(121) }, "description", "tooLong"],
    ] as const)("rejects %s", (_l, patch, field, code) => {
      const r = fail(createCoupon({ code: "VALID1", percentOff: 10, ...patch } as CouponInput));
      expect(r.status).toBe(400);
      expect(r.fields[field]).toBe(code);
      expect(listCoupons()).toHaveLength(seed.length); // nothing written
    });

    it("accepts the boundary percentages 1 and 100", () => {
      expect(createCoupon({ code: "ONE", percentOff: 1 }).ok).toBe(true);
      expect(createCoupon({ code: "FREE", percentOff: 100 }).ok).toBe(true);
    });

    it("rejects a duplicate code case-insensitively as a 409", () => {
      expect(fail(createCoupon({ code: "save10", percentOff: 5 }))).toMatchObject({ status: 409, fields: { code: "taken" } });
    });
  });

  describe("update", () => {
    const id = () => listCoupons()[0].id;

    it("changes percent, note and active — never the code", () => {
      const original = listCoupons()[0].code;
      const r = updateCoupon(id(), { percentOff: 25, description: "Bigger", active: false, code: "HACKED" } as never);
      if (!r.ok) throw new Error("update failed");
      expect(r.coupon).toMatchObject({ code: original, percentOff: 25, description: "Bigger", active: false });
      expect(getCouponById(id())?.code).toBe(original);
    });

    it("deactivating takes effect at checkout immediately; reactivating restores it", () => {
      const code = listCoupons()[0].code;
      updateCoupon(id(), { percentOff: 10, active: false });
      expect(findActiveCoupon(code)).toBeUndefined();
      updateCoupon(id(), { percentOff: 10, active: true });
      expect(findActiveCoupon(code)).toBeDefined();
    });

    it("an edited percent is what checkout now applies", () => {
      updateCoupon(id(), { percentOff: 40 });
      expect(findActiveCoupon(listCoupons()[0].code)?.percentOff).toBe(40);
    });

    it("keeps the current active flag when the input doesn't say", () => {
      updateCoupon(id(), { percentOff: 10, active: false });
      updateCoupon(id(), { percentOff: 12 });
      expect(getCouponById(id())?.active).toBe(false);
    });

    it("validates percent like create does, and 404s on an unknown id", () => {
      expect(fail(updateCoupon(id(), { percentOff: 0 })).fields.percentOff).toBe("invalidPercent");
      expect(fail(updateCoupon("nope", { percentOff: 10 })).status).toBe(404);
    });
  });

  // NOTE: the mock order store is module-level state shared by every test in this
  // file, so tests below compare counts to a "before" snapshot instead of assuming zero.
  describe("delete — the 409 constraint", () => {
    it("deletes an unused coupon, which then stops working at checkout, and persists the removal", () => {
      const target = listCoupons()[0];
      expect(deleteCoupon(target.id).ok).toBe(true);
      expect(findActiveCoupon(target.code)).toBeUndefined();
      expect(JSON.parse(window.localStorage.getItem(KEY)!).items.some((c: { id: string }) => c.id === target.id)).toBe(false);
    });

    it("refuses with 409 and a count while an order recorded the code, and removes nothing", async () => {
      const target = listCoupons()[0];
      const store = createStore();
      const before = countOrdersUsingCoupon(target.code);
      await store.dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput(target.code)));
      await store.dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput(target.code.toLowerCase())));
      expect(countOrdersUsingCoupon(target.code)).toBe(before + 2); // case-insensitive
      expect(deleteCoupon(target.id)).toEqual({ ok: false, status: 409, reason: "usedInOrders", orderCount: before + 2 });
      expect(getCouponById(target.id)).toBeDefined();
    });

    it("a used coupon can still be retired by deactivating it", async () => {
      const target = listCoupons()[0];
      await createStore().dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput(target.code)));
      expect(deleteCoupon(target.id).ok).toBe(false);
      expect(updateCoupon(target.id, { percentOff: target.percentOff, active: false }).ok).toBe(true);
      expect(findActiveCoupon(target.code)).toBeUndefined();
    });

    it("orders that used a different coupon, or none, don't block deletion", async () => {
      const [first, second] = listCoupons();
      const store = createStore();
      await store.dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput(first.code)));
      await store.dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput()));
      expect(deleteCoupon(second.id).ok).toBe(true);
    });

    it("an order placed without a coupon records no couponCode key at all (legacy-shaped, still loads)", async () => {
      const store = createStore();
      const before = countOrdersUsingCoupon("SAVE10");
      const r = await store.dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput()));
      if (!("data" in r) || !r.data) throw new Error("order not placed");
      expect(r.data).not.toHaveProperty("couponCode");
      expect(countOrdersUsingCoupon("SAVE10")).toBe(before); // a coupon-less order counts toward nothing
    });

    it("returns 404 for an unknown id", () => {
      expect(deleteCoupon("nope")).toEqual({ ok: false, status: 404 });
    });

    it("deleting EVERY coupon is valid and stays empty after a reload (the seed does not resurrect)", async () => {
      // Fresh modules => a fresh (empty) order store, so no earlier test's orders can block a delete.
      vi.resetModules();
      const first = await import("../../services/catalog/couponStore");
      first.listCoupons().forEach((c) => expect(first.deleteCoupon(c.id).ok).toBe(true));
      expect(first.listCoupons()).toEqual([]);
      vi.resetModules();
      const second = await import("../../services/catalog/couponStore");
      expect(second.listCoupons()).toEqual([]);
    });
  });

  describe("corrupt or mismatched storage falls back to the seed instead of crashing", () => {
    const seeded = () => expect(listCoupons()).toHaveLength(seed.length);
    it("unparseable JSON", () => { window.localStorage.setItem(KEY, "{bad"); seeded(); });
    it("a different version", () => { window.localStorage.setItem(KEY, JSON.stringify({ version: 2, items: [] })); seeded(); });
    it("items with the wrong shape", () => {
      window.localStorage.setItem(KEY, JSON.stringify({ version: 1, items: [{ code: "X", percentOff: "ten" }] }));
      seeded();
    });
    it("a non-object payload", () => { window.localStorage.setItem(KEY, JSON.stringify(["nope"])); seeded(); });
    it("recovers: a later write replaces the bad data", () => {
      window.localStorage.setItem(KEY, "{bad");
      createCoupon({ code: "FRESH", percentOff: 5 });
      expect(JSON.parse(window.localStorage.getItem(KEY)!).version).toBe(1);
    });
  });
});
