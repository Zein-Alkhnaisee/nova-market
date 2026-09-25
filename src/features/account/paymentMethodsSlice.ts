import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";
import { generateId } from "../../lib/id";
import type { SavedPaymentMethod } from "../../types/address";

interface PaymentMethodsState {
  items: SavedPaymentMethod[];
}

const initialState: PaymentMethodsState = {
  items: loadPersisted<SavedPaymentMethod[]>("paymentMethods", []),
};

const paymentMethodsSlice = createSlice({
  name: "paymentMethods",
  initialState,
  reducers: {
    addPaymentMethod: {
      reducer: (state, action: PayloadAction<SavedPaymentMethod>) => {
        if (action.payload.isDefault) {
          state.items.forEach((item) => (item.isDefault = false));
        }
        state.items.push(action.payload);
      },
      prepare: (input: { brand: string; last4: string; expiry: string; isDefault?: boolean }) => ({
        payload: { ...input, id: generateId("pm"), isDefault: input.isDefault ?? false } as SavedPaymentMethod,
      }),
    },
    removePaymentMethod: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setDefaultPaymentMethod: (state, action: PayloadAction<string>) => {
      state.items.forEach((item) => (item.isDefault = item.id === action.payload));
    },
  },
});

export const { addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } =
  paymentMethodsSlice.actions;
export default paymentMethodsSlice.reducer;

export const selectPaymentMethods = (state: { paymentMethods: PaymentMethodsState }) =>
  state.paymentMethods.items;
