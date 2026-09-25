import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";

const MAX_RECENTLY_VIEWED = 12;

interface RecentlyViewedState {
  productIds: string[];
}

const initialState: RecentlyViewedState = {
  productIds: loadPersisted<string[]>("recentlyViewed", []),
};

const recentlyViewedSlice = createSlice({
  name: "recentlyViewed",
  initialState,
  reducers: {
    recordProductView: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.productIds = [id, ...state.productIds.filter((existing) => existing !== id)].slice(
        0,
        MAX_RECENTLY_VIEWED
      );
    },
    clearRecentlyViewed: (state) => {
      state.productIds = [];
    },
  },
});

export const { recordProductView, clearRecentlyViewed } = recentlyViewedSlice.actions;
export default recentlyViewedSlice.reducer;

export const selectRecentlyViewedIds = (state: { recentlyViewed: RecentlyViewedState }) =>
  state.recentlyViewed.productIds;
