import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";
import { generateId } from "../../lib/id";
import type { UserCollection } from "../../types/userCollection";

interface UserCollectionsState {
  items: UserCollection[];
}

const initialState: UserCollectionsState = {
  items: loadPersisted<UserCollection[]>("userCollections", []),
};

const userCollectionsSlice = createSlice({
  name: "userCollections",
  initialState,
  reducers: {
    createCollection: {
      reducer: (state, action: PayloadAction<UserCollection>) => {
        state.items.push(action.payload);
      },
      prepare: (input: { name: string; isPublic?: boolean; productIds?: string[] }) => ({
        payload: {
          id: generateId("col"),
          name: input.name,
          isPublic: input.isPublic ?? false,
          productIds: input.productIds ?? [],
          createdAt: new Date().toISOString(),
        } as UserCollection,
      }),
    },
    renameCollection: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const collection = state.items.find((c) => c.id === action.payload.id);
      if (collection) collection.name = action.payload.name;
    },
    deleteCollection: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
    setCollectionVisibility: (state, action: PayloadAction<{ id: string; isPublic: boolean }>) => {
      const collection = state.items.find((c) => c.id === action.payload.id);
      if (collection) collection.isPublic = action.payload.isPublic;
    },
    addProductToCollection: (state, action: PayloadAction<{ collectionId: string; productId: string }>) => {
      const collection = state.items.find((c) => c.id === action.payload.collectionId);
      if (collection && !collection.productIds.includes(action.payload.productId)) {
        collection.productIds.push(action.payload.productId);
      }
    },
    removeProductFromCollection: (
      state,
      action: PayloadAction<{ collectionId: string; productId: string }>
    ) => {
      const collection = state.items.find((c) => c.id === action.payload.collectionId);
      if (collection) {
        collection.productIds = collection.productIds.filter((id) => id !== action.payload.productId);
      }
    },
  },
});

export const {
  createCollection,
  renameCollection,
  deleteCollection,
  setCollectionVisibility,
  addProductToCollection,
  removeProductFromCollection,
} = userCollectionsSlice.actions;
export default userCollectionsSlice.reducer;

export const selectUserCollections = (state: { userCollections: UserCollectionsState }) =>
  state.userCollections.items;
export const selectUserCollectionById = (id: string) => (state: { userCollections: UserCollectionsState }) =>
  state.userCollections.items.find((c) => c.id === id);
