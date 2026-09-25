import { describe, expect, it } from "vitest";
import compareReducer, { toggleCompare, clearCompare } from "../../features/compare/compareSlice";

describe("compareSlice", () => {
  it("adds a product id on toggle", () => {
    const state = compareReducer(undefined, toggleCompare("p1"));
    expect(state.productIds).toEqual(["p1"]);
  });

  it("removes a product id when toggled again", () => {
    let state = compareReducer(undefined, toggleCompare("p1"));
    state = compareReducer(state, toggleCompare("p1"));
    expect(state.productIds).toEqual([]);
  });

  it("caps the list at 4 products", () => {
    let state = compareReducer(undefined, toggleCompare("p1"));
    state = compareReducer(state, toggleCompare("p2"));
    state = compareReducer(state, toggleCompare("p3"));
    state = compareReducer(state, toggleCompare("p4"));
    state = compareReducer(state, toggleCompare("p5"));
    expect(state.productIds).toEqual(["p1", "p2", "p3", "p4"]);
  });

  it("clears all compared products", () => {
    let state = compareReducer(undefined, toggleCompare("p1"));
    state = compareReducer(state, clearCompare());
    expect(state.productIds).toEqual([]);
  });
});
