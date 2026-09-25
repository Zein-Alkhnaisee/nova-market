import { describe, expect, it } from "vitest";
import userCollectionsReducer, {
  addProductToCollection,
  createCollection,
  deleteCollection,
  removeProductFromCollection,
  renameCollection,
  selectUserCollectionById,
  selectUserCollections,
  setCollectionVisibility,
} from "../../features/account/userCollectionsSlice";

describe("userCollectionsSlice", () => {
  it("creates a collection, private by default", () => {
    const state = userCollectionsReducer(undefined, createCollection({ name: "Gift ideas" }));
    const collection = state.items[0];
    expect(collection.name).toBe("Gift ideas");
    expect(collection.isPublic).toBe(false);
    expect(collection.productIds).toEqual([]);
    expect(collection.id).toMatch(/^col-/);
  });

  it("can seed a collection with initial product ids on creation", () => {
    const state = userCollectionsReducer(
      undefined,
      createCollection({ name: "Starter", productIds: ["p1", "p2"] })
    );
    expect(state.items[0].productIds).toEqual(["p1", "p2"]);
  });

  it("gives distinct ids to collections created back-to-back", () => {
    let state = userCollectionsReducer(undefined, createCollection({ name: "A" }));
    state = userCollectionsReducer(state, createCollection({ name: "B" }));
    state = userCollectionsReducer(state, createCollection({ name: "C" }));
    const ids = state.items.map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("renames a collection", () => {
    let state = userCollectionsReducer(undefined, createCollection({ name: "Old name" }));
    const id = state.items[0].id;
    state = userCollectionsReducer(state, renameCollection({ id, name: "New name" }));
    expect(state.items[0].name).toBe("New name");
  });

  it("deletes a collection", () => {
    let state = userCollectionsReducer(undefined, createCollection({ name: "Temp" }));
    state = userCollectionsReducer(state, deleteCollection(state.items[0].id));
    expect(state.items).toHaveLength(0);
  });

  it("toggles visibility", () => {
    let state = userCollectionsReducer(undefined, createCollection({ name: "Gift ideas" }));
    const id = state.items[0].id;
    state = userCollectionsReducer(state, setCollectionVisibility({ id, isPublic: true }));
    expect(state.items[0].isPublic).toBe(true);
    state = userCollectionsReducer(state, setCollectionVisibility({ id, isPublic: false }));
    expect(state.items[0].isPublic).toBe(false);
  });

  it("adds a product to a collection without duplicating it", () => {
    let state = userCollectionsReducer(undefined, createCollection({ name: "Gift ideas" }));
    const id = state.items[0].id;
    state = userCollectionsReducer(state, addProductToCollection({ collectionId: id, productId: "p1" }));
    state = userCollectionsReducer(state, addProductToCollection({ collectionId: id, productId: "p1" }));
    expect(state.items[0].productIds).toEqual(["p1"]);
  });

  it("removes a product from a collection", () => {
    let state = userCollectionsReducer(
      undefined,
      createCollection({ name: "Gift ideas", productIds: ["p1", "p2"] })
    );
    const id = state.items[0].id;
    state = userCollectionsReducer(state, removeProductFromCollection({ collectionId: id, productId: "p1" }));
    expect(state.items[0].productIds).toEqual(["p2"]);
  });

  it("keeps collections independent — editing one doesn't affect another", () => {
    let state = userCollectionsReducer(undefined, createCollection({ name: "A", productIds: ["p1"] }));
    state = userCollectionsReducer(state, createCollection({ name: "B", productIds: ["p1"] }));
    const [a, b] = state.items;
    state = userCollectionsReducer(state, removeProductFromCollection({ collectionId: a.id, productId: "p1" }));
    expect(selectUserCollectionById(a.id)({ userCollections: state })?.productIds).toEqual([]);
    expect(selectUserCollectionById(b.id)({ userCollections: state })?.productIds).toEqual(["p1"]);
  });

  it("selectUserCollections returns all collections", () => {
    let state = userCollectionsReducer(undefined, createCollection({ name: "A" }));
    state = userCollectionsReducer(state, createCollection({ name: "B" }));
    expect(selectUserCollections({ userCollections: state })).toHaveLength(2);
  });
});
