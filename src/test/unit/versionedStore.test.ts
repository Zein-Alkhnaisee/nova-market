import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVersionedStore } from "../../lib/versionedStore";

interface Item {
  id: string;
  n: number;
}
const isItems = (v: unknown): v is Item[] =>
  Array.isArray(v) && v.every((x) => x && typeof x.id === "string" && typeof x.n === "number");

const KEY = "widgets:v1";
const make = () =>
  createVersionedStore<Item>({
    key: KEY,
    version: 1,
    seed: () => [{ id: "a", n: 1 }],
    isValid: isItems,
  });
const raw = () => window.localStorage.getItem(`nova:${KEY}`);

describe("createVersionedStore (shared by products, categories and coupons)", () => {
  beforeEach(() => window.localStorage.clear());

  it("serves a fresh seed copy without writing storage", () => {
    const store = make();
    expect(store.read()).toEqual([{ id: "a", n: 1 }]);
    expect(raw()).toBeNull();
  });

  it("never lets one store's mutation leak into the next seed", () => {
    const first = make();
    first.read()[0].n = 99; // a careless caller mutating the cached list...
    first.reset();
    expect(first.read()[0].n).toBe(1); // ...doesn't corrupt the re-seeded data
  });

  it("write caches the new items and persists them under nova:<key> with the version envelope", () => {
    const store = make();
    store.write([{ id: "b", n: 2 }]);
    expect(store.read()).toEqual([{ id: "b", n: 2 }]);
    expect(JSON.parse(raw()!)).toEqual({ version: 1, items: [{ id: "b", n: 2 }] });
  });

  it("survives a reload: a new instance reads what was written", () => {
    make().write([{ id: "b", n: 2 }]);
    expect(make().read()).toEqual([{ id: "b", n: 2 }]);
  });

  it("reset forgets the cache and deletes the stored data", () => {
    const store = make();
    store.write([{ id: "b", n: 2 }]);
    store.reset();
    expect(raw()).toBeNull();
    expect(store.read()).toEqual([{ id: "a", n: 1 }]);
  });

  it("an empty list is stored and loaded as empty when the store's own validator allows it", () => {
    const store = make();
    store.write([]);
    expect(make().read()).toEqual([]); // not re-seeded
  });

  it.each([
    ["unparseable JSON", "{nope"],
    ["a different version", JSON.stringify({ version: 2, items: [{ id: "x", n: 1 }] })],
    ["items failing the shape check", JSON.stringify({ version: 1, items: [{ id: 1 }] })],
    ["a non-object payload", JSON.stringify(["nope"])],
    ["a missing items field", JSON.stringify({ version: 1 })],
  ])("falls back to the seed for %s, and a later write repairs it", (_label, payload) => {
    window.localStorage.setItem(`nova:${KEY}`, payload);
    const store = make();
    expect(store.read()).toEqual([{ id: "a", n: 1 }]);
    store.write([{ id: "z", n: 5 }]);
    expect(JSON.parse(raw()!).version).toBe(1);
  });

  it("keeps working in memory when storage is unavailable", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const store = make();
    expect(() => store.write([{ id: "m", n: 3 }])).not.toThrow();
    expect(store.read()).toEqual([{ id: "m", n: 3 }]);
    spy.mockRestore();
  });

  it("isolates two stores with different keys", () => {
    const a = make();
    const b = createVersionedStore<Item>({ key: "other:v1", version: 1, seed: () => [], isValid: isItems });
    a.write([{ id: "x", n: 1 }]);
    expect(b.read()).toEqual([]);
  });
});
