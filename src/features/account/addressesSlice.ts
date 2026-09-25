import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";
import { generateId } from "../../lib/id";
import type { SavedAddress } from "../../types/address";
import type { ShippingAddress } from "../../types/order";

interface AddressesState {
  items: SavedAddress[];
}

const initialState: AddressesState = { items: loadPersisted<SavedAddress[]>("addresses", []) };

const addressesSlice = createSlice({
  name: "addresses",
  initialState,
  reducers: {
    addAddress: {
      reducer: (state, action: PayloadAction<SavedAddress>) => {
        if (action.payload.isDefault) {
          state.items.forEach((item) => (item.isDefault = false));
        }
        state.items.push(action.payload);
      },
      prepare: (input: { label: string; address: ShippingAddress; isDefault?: boolean }) => ({
        payload: {
          ...input.address,
          id: generateId("addr"),
          label: input.label,
          isDefault: input.isDefault ?? false,
        } as SavedAddress,
      }),
    },
    updateAddress: (state, action: PayloadAction<SavedAddress>) => {
      if (action.payload.isDefault) {
        state.items.forEach((item) => (item.isDefault = item.id === action.payload.id));
      }
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) state.items[index] = action.payload;
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setDefaultAddress: (state, action: PayloadAction<string>) => {
      state.items.forEach((item) => (item.isDefault = item.id === action.payload));
    },
  },
});

export const { addAddress, updateAddress, removeAddress, setDefaultAddress } = addressesSlice.actions;
export default addressesSlice.reducer;

export const selectAddresses = (state: { addresses: AddressesState }) => state.addresses.items;
