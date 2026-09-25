import { describe, expect, it } from "vitest";
import addressesReducer, {
  addAddress,
  removeAddress,
  setDefaultAddress,
  updateAddress,
} from "../../features/account/addressesSlice";
import paymentMethodsReducer, {
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "../../features/account/paymentMethodsSlice";
import type { ShippingAddress } from "../../types/order";

const address: ShippingAddress = {
  fullName: "Jordan Lee",
  line1: "1 Market St",
  city: "SF",
  region: "CA",
  postalCode: "94105",
  country: "US",
  phone: "+14155550100",
};

describe("addressesSlice", () => {
  it("adds an address with a generated id", () => {
    const state = addressesReducer(undefined, addAddress({ label: "Home", address }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].label).toBe("Home");
    expect(state.items[0].id).toMatch(/^addr-/);
  });

  it("keeps exactly one default when a new default is added", () => {
    let state = addressesReducer(undefined, addAddress({ label: "Home", address, isDefault: true }));
    state = addressesReducer(state, addAddress({ label: "Work", address, isDefault: true }));
    expect(state.items.filter((a) => a.isDefault)).toHaveLength(1);
    expect(state.items.find((a) => a.isDefault)?.label).toBe("Work");
  });

  it("setDefaultAddress moves the default flag exclusively", () => {
    let state = addressesReducer(undefined, addAddress({ label: "Home", address, isDefault: true }));
    state = addressesReducer(state, addAddress({ label: "Work", address }));
    const workId = state.items[1].id;
    state = addressesReducer(state, setDefaultAddress(workId));
    expect(state.items.filter((a) => a.isDefault)).toHaveLength(1);
    expect(state.items.find((a) => a.isDefault)?.id).toBe(workId);
  });

  it("updates an existing address in place", () => {
    let state = addressesReducer(undefined, addAddress({ label: "Home", address }));
    const existing = state.items[0];
    state = addressesReducer(state, updateAddress({ ...existing, city: "Oakland" }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].city).toBe("Oakland");
  });

  it("removes an address", () => {
    let state = addressesReducer(undefined, addAddress({ label: "Home", address }));
    state = addressesReducer(state, removeAddress(state.items[0].id));
    expect(state.items).toHaveLength(0);
  });
});

describe("paymentMethodsSlice", () => {
  it("stores only masked card details", () => {
    const state = paymentMethodsReducer(
      undefined,
      addPaymentMethod({ brand: "Visa", last4: "4242", expiry: "12/30" })
    );
    const method = state.items[0];
    expect(method.last4).toBe("4242");
    expect(JSON.stringify(method)).not.toMatch(/4242424242424242/);
    expect(Object.keys(method).sort()).toEqual(["brand", "expiry", "id", "isDefault", "last4"]);
  });

  it("keeps exactly one default payment method", () => {
    let state = paymentMethodsReducer(
      undefined,
      addPaymentMethod({ brand: "Visa", last4: "4242", expiry: "12/30", isDefault: true })
    );
    state = paymentMethodsReducer(
      state,
      addPaymentMethod({ brand: "Mastercard", last4: "4444", expiry: "01/31", isDefault: true })
    );
    expect(state.items.filter((m) => m.isDefault)).toHaveLength(1);
    expect(state.items.find((m) => m.isDefault)?.last4).toBe("4444");
  });

  it("setDefaultPaymentMethod moves the flag exclusively", () => {
    let state = paymentMethodsReducer(
      undefined,
      addPaymentMethod({ brand: "Visa", last4: "4242", expiry: "12/30", isDefault: true })
    );
    state = paymentMethodsReducer(
      state,
      addPaymentMethod({ brand: "Mastercard", last4: "4444", expiry: "01/31" })
    );
    const secondId = state.items[1].id;
    state = paymentMethodsReducer(state, setDefaultPaymentMethod(secondId));
    expect(state.items.find((m) => m.isDefault)?.id).toBe(secondId);
  });

  it("removes a payment method", () => {
    let state = paymentMethodsReducer(
      undefined,
      addPaymentMethod({ brand: "Visa", last4: "4242", expiry: "12/30" })
    );
    state = paymentMethodsReducer(state, removePaymentMethod(state.items[0].id));
    expect(state.items).toHaveLength(0);
  });
});

describe("id generation", () => {
  it("gives distinct ids to records created in the same millisecond", () => {
    // Regression test: ids were previously `addr-${Date.now()}`, which
    // collided for back-to-back adds and made "set default"/"remove" act on
    // the wrong record.
    let state = addressesReducer(undefined, addAddress({ label: "A", address }));
    state = addressesReducer(state, addAddress({ label: "B", address }));
    state = addressesReducer(state, addAddress({ label: "C", address }));
    const ids = state.items.map((a) => a.id);
    expect(new Set(ids).size).toBe(3);
  });
});
