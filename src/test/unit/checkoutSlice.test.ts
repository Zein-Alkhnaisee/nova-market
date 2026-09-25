import { describe, expect, it } from "vitest";
import checkoutReducer, {
  setShippingAddress,
  setDeliveryOption,
  setCoupon,
  resetCheckoutDraft,
} from "../../features/checkout/checkoutSlice";
import type { DeliveryOption, ShippingAddress } from "../../types/order";

const address: ShippingAddress = {
  fullName: "Jordan Lee",
  line1: "1 Market St",
  city: "San Francisco",
  region: "CA",
  postalCode: "94105",
  country: "US",
  phone: "+1 415 555 0100",
};

const delivery: DeliveryOption = { id: "express", label: "Express", etaDays: "2-3 days", price: 16 };

describe("checkoutSlice", () => {
  it("stores the shipping address", () => {
    const state = checkoutReducer(undefined, setShippingAddress(address));
    expect(state.shippingAddress).toEqual(address);
  });

  it("stores the delivery option", () => {
    const state = checkoutReducer(undefined, setDeliveryOption(delivery));
    expect(state.deliveryOption).toEqual(delivery);
  });

  it("applies a coupon", () => {
    const state = checkoutReducer(undefined, setCoupon({ code: "SAVE10", percentOff: 10 }));
    expect(state.couponCode).toBe("SAVE10");
    expect(state.discountPercent).toBe(10);
  });

  it("removes a coupon when set to null", () => {
    let state = checkoutReducer(undefined, setCoupon({ code: "SAVE10", percentOff: 10 }));
    state = checkoutReducer(state, setCoupon(null));
    expect(state.couponCode).toBeNull();
    expect(state.discountPercent).toBe(0);
  });

  it("resets the entire draft", () => {
    let state = checkoutReducer(undefined, setShippingAddress(address));
    state = checkoutReducer(state, setDeliveryOption(delivery));
    state = checkoutReducer(state, resetCheckoutDraft());
    expect(state.shippingAddress).toBeNull();
    expect(state.deliveryOption).toBeNull();
  });
});
