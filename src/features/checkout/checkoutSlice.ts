import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";
import type { DeliveryOption, ShippingAddress } from "../../types/order";

interface CheckoutState {
  shippingAddress: ShippingAddress | null;
  deliveryOption: DeliveryOption | null;
  couponCode: string | null;
  discountPercent: number;
}

const initialState: CheckoutState = loadPersisted<CheckoutState>("checkoutDraft", {
  shippingAddress: null,
  deliveryOption: null,
  couponCode: null,
  discountPercent: 0,
});

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setShippingAddress: (state, action: PayloadAction<ShippingAddress>) => {
      state.shippingAddress = action.payload;
    },
    setDeliveryOption: (state, action: PayloadAction<DeliveryOption>) => {
      state.deliveryOption = action.payload;
    },
    setCoupon: (state, action: PayloadAction<{ code: string; percentOff: number } | null>) => {
      state.couponCode = action.payload?.code ?? null;
      state.discountPercent = action.payload?.percentOff ?? 0;
    },
    resetCheckoutDraft: () => ({
      shippingAddress: null,
      deliveryOption: null,
      couponCode: null,
      discountPercent: 0,
    }),
  },
});

export const { setShippingAddress, setDeliveryOption, setCoupon, resetCheckoutDraft } =
  checkoutSlice.actions;
export default checkoutSlice.reducer;

export const selectShippingAddress = (state: { checkout: CheckoutState }) => state.checkout.shippingAddress;
export const selectDeliveryOption = (state: { checkout: CheckoutState }) => state.checkout.deliveryOption;
export const selectCouponCode = (state: { checkout: CheckoutState }) => state.checkout.couponCode;
export const selectDiscountPercent = (state: { checkout: CheckoutState }) => state.checkout.discountPercent;
