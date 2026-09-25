import { describe, expect, it } from "vitest";
import recentSearchesReducer, {
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "../../features/search/recentSearchesSlice";

describe("recentSearchesSlice", () => {
  it("adds a new search term to the front", () => {
    const state = recentSearchesReducer(undefined, addRecentSearch("headphones"));
    expect(state.terms).toEqual(["headphones"]);
  });

  it("moves a re-searched term to the front instead of duplicating it", () => {
    let state = recentSearchesReducer(undefined, addRecentSearch("headphones"));
    state = recentSearchesReducer(state, addRecentSearch("keyboard"));
    state = recentSearchesReducer(state, addRecentSearch("headphones"));
    expect(state.terms).toEqual(["headphones", "keyboard"]);
  });

  it("is case-insensitive when deduping", () => {
    let state = recentSearchesReducer(undefined, addRecentSearch("Headphones"));
    state = recentSearchesReducer(state, addRecentSearch("headphones"));
    expect(state.terms).toEqual(["headphones"]);
  });

  it("ignores blank/whitespace-only terms", () => {
    const state = recentSearchesReducer(undefined, addRecentSearch("   "));
    expect(state.terms).toEqual([]);
  });

  it("caps the list at 8 terms", () => {
    let state = recentSearchesReducer(undefined, { type: "init" } as never);
    for (let i = 0; i < 10; i++) {
      state = recentSearchesReducer(state, addRecentSearch(`term-${i}`));
    }
    expect(state.terms).toHaveLength(8);
    expect(state.terms[0]).toBe("term-9");
  });

  it("removes a specific term", () => {
    let state = recentSearchesReducer(undefined, addRecentSearch("headphones"));
    state = recentSearchesReducer(state, addRecentSearch("keyboard"));
    state = recentSearchesReducer(state, removeRecentSearch("headphones"));
    expect(state.terms).toEqual(["keyboard"]);
  });

  it("clears all terms", () => {
    let state = recentSearchesReducer(undefined, addRecentSearch("headphones"));
    state = recentSearchesReducer(state, clearRecentSearches());
    expect(state.terms).toEqual([]);
  });
});
