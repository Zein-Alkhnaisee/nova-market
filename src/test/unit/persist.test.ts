import { describe, expect, it } from "vitest";
import { loadPersisted, savePersisted } from "../../lib/persist";

describe("persist helpers", () => {
  it("returns the fallback when nothing is stored", () => {
    expect(loadPersisted("missing-key", ["fallback"])).toEqual(["fallback"]);
  });

  it("round-trips a value through save/load", () => {
    savePersisted("wishlist", ["p1", "p2"]);
    expect(loadPersisted("wishlist", [])).toEqual(["p1", "p2"]);
  });

  it("falls back gracefully on corrupted JSON", () => {
    window.localStorage.setItem("nova:cart", "{not valid json");
    expect(loadPersisted("cart", [])).toEqual([]);
  });
});
