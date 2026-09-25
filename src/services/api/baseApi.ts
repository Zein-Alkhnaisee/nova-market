import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Shared base API slice.
 *
 * Phase 1 uses `fakeBaseQuery` + `queryFn` per-endpoint so the app can run
 * fully in-memory against `mocks/data` with zero network dependency, while
 * keeping the exact same RTK Query surface (tags, invalidation, hooks) that
 * a real `fetchBaseQuery({ baseUrl: '/api' })` would use later.
 *
 * Swapping to a real backend means changing this file only — feature APIs
 * (productsApi, cartApi, etc.) do not need to change their public shape.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<{ status: number; message: string }>(),
  tagTypes: [
    "Product",
    "Products",
    "Category",
    "Cart",
    "Wishlist",
    "Collection",
    "Order",
    "Review",
    "User",
    "Search",
    "Recommendation",
  ],
  endpoints: () => ({}),
});
