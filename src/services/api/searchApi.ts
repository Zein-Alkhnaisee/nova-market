import { baseApi } from "./baseApi";
import { products } from "../../mocks/data/products";
import { categories } from "../../mocks/data/categories";
import { trendingSearchTerms } from "../../mocks/data/trendingSearches";
import { delay } from "../../lib/delay";
import type { Category, ProductSummary } from "../../types/product";

export interface SearchSuggestions {
  products: ProductSummary[];
  categories: Category[];
  query: string;
}

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSearchSuggestions: builder.query<SearchSuggestions, string>({
      queryFn: async (rawQuery) => {
        const query = rawQuery.trim().toLowerCase();
        if (!query) {
          return { data: { products: [], categories: [], query: rawQuery } };
        }
        const matchedProducts = products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.brand.toLowerCase().includes(query)
          )
          .slice(0, 5);
        const matchedCategories = categories
          .filter((c) => c.name.toLowerCase().includes(query))
          .slice(0, 4);
        return {
          data: await delay(
            { products: matchedProducts, categories: matchedCategories, query: rawQuery },
            200
          ),
        };
      },
      providesTags: [{ type: "Search", id: "SUGGESTIONS" }],
    }),
    getTrendingSearches: builder.query<string[], void>({
      queryFn: async () => ({ data: await delay(trendingSearchTerms, 100) }),
    }),
  }),
});

export const { useGetSearchSuggestionsQuery, useGetTrendingSearchesQuery } = searchApi;
