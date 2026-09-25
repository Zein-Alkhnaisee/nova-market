import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";

const MAX_RECENT_SEARCHES = 8;

interface RecentSearchesState {
  terms: string[];
}

const initialState: RecentSearchesState = {
  terms: loadPersisted<string[]>("recentSearches", []),
};

const recentSearchesSlice = createSlice({
  name: "recentSearches",
  initialState,
  reducers: {
    addRecentSearch: (state, action: PayloadAction<string>) => {
      const term = action.payload.trim();
      if (!term) return;
      const normalized = term.toLowerCase();
      state.terms = [term, ...state.terms.filter((t) => t.toLowerCase() !== normalized)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
    },
    removeRecentSearch: (state, action: PayloadAction<string>) => {
      state.terms = state.terms.filter((t) => t !== action.payload);
    },
    clearRecentSearches: (state) => {
      state.terms = [];
    },
  },
});

export const { addRecentSearch, removeRecentSearch, clearRecentSearches } = recentSearchesSlice.actions;
export default recentSearchesSlice.reducer;

export const selectRecentSearches = (state: { recentSearches: RecentSearchesState }) =>
  state.recentSearches.terms;
