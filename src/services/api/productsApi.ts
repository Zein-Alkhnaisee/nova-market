import { baseApi } from "./baseApi";
import { products } from "../../mocks/data/products";
import { delay } from "../../lib/delay";
import type { ProductSummary } from "../../types/product";

export type SortOption = "relevance" | "price-asc" | "price-desc" | "rating" | "newest";

export interface ProductListParams {
  categoryId?: string;
  badge?: ProductSummary["badge"];
  limit?: number;
  q?: string;
  sort?: SortOption;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
}

function matchesQuery(product: ProductSummary, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  return (
    product.name.toLowerCase().includes(query) ||
    product.brand.toLowerCase().includes(query) ||
    product.categoryId.toLowerCase().includes(query.replace(/\s+/g, "-"))
  );
}

function applySort(list: ProductSummary[], sort?: SortOption) {
  const sorted = [...list];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "newest":
      return sorted.sort((a, b) => (b.badge === "new" ? 1 : 0) - (a.badge === "new" ? 1 : 0));
    default:
      return sorted;
  }
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductSummary[], ProductListParams | void>({
      queryFn: async (params) => {
        let result = products;
        if (params?.categoryId) {
          result = result.filter((p) => p.categoryId === params.categoryId);
        }
        if (params?.badge) {
          result = result.filter((p) => p.badge === params.badge);
        }
        if (params?.q) {
          result = result.filter((p) => matchesQuery(p, params.q!));
        }
        if (params?.minPrice != null) {
          result = result.filter((p) => p.price >= params.minPrice!);
        }
        if (params?.maxPrice != null) {
          result = result.filter((p) => p.price <= params.maxPrice!);
        }
        if (params?.minRating != null) {
          result = result.filter((p) => p.rating >= params.minRating!);
        }
        if (params?.inStockOnly) {
          result = result.filter((p) => p.inStock);
        }
        result = applySort(result, params?.sort ?? undefined);
        if (params?.limit) {
          result = result.slice(0, params.limit);
        }
        return { data: await delay(result) };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Products" as const, id: "LIST" },
            ]
          : [{ type: "Products" as const, id: "LIST" }],
    }),
    getProductBySlug: builder.query<ProductSummary | undefined, string>({
      queryFn: async (slug) => {
        const product = products.find((p) => p.slug === slug);
        return { data: await delay(product) };
      },
      providesTags: (_result, _error, slug) => [{ type: "Product", id: slug }],
    }),
  }),
});

export const { useGetProductsQuery, useGetProductBySlugQuery } = productsApi;

