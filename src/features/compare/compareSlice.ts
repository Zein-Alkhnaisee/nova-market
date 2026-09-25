import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const MAX_COMPARE_ITEMS = 4;

interface CompareState {
  productIds: string[];
}

const initialState: CompareState = { productIds: [] };

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    toggleCompare: (state, action: PayloadAction<string>) => {
      const idx = state.productIds.indexOf(action.payload);
      if (idx >= 0) {
        state.productIds.splice(idx, 1);
      } else if (state.productIds.length < MAX_COMPARE_ITEMS) {
        state.productIds.push(action.payload);
      }
    },
    clearCompare: (state) => {
      state.productIds = [];
    },
  },
});

export const { toggleCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;

export const selectCompareIds = (state: { compare: CompareState }) => state.compare.productIds;
