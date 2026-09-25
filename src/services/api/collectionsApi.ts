import { baseApi } from "./baseApi";
import { collections } from "../../mocks/data/collections";
import { delay } from "../../lib/delay";
import type { Collection } from "../../types/collection";

export const collectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollections: builder.query<Collection[], void>({
      queryFn: async () => ({ data: await delay(collections, 150) }),
      providesTags: [{ type: "Collection", id: "LIST" }],
    }),
    getCollectionBySlug: builder.query<Collection | undefined, string>({
      queryFn: async (slug) => ({ data: await delay(collections.find((c) => c.slug === slug), 150) }),
      providesTags: (_r, _e, slug) => [{ type: "Collection", id: slug }],
    }),
  }),
});

export const { useGetCollectionsQuery, useGetCollectionBySlugQuery } = collectionsApi;
