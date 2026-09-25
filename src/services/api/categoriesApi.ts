import { baseApi } from "./baseApi";
import { categories } from "../../mocks/data/categories";
import { delay } from "../../lib/delay";
import type { Category } from "../../types/product";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      queryFn: async () => ({ data: await delay(categories, 150) }),
      providesTags: [{ type: "Category", id: "LIST" }],
    }),
  }),
});

export const { useGetCategoriesQuery } = categoriesApi;
