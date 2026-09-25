import { baseApi } from "./baseApi";
import { products } from "../../mocks/data/products";
import { categories } from "../../mocks/data/categories";
import { delay } from "../../lib/delay";
import type { ProductSummary, RecommendedProduct } from "../../types/product";

function categoryName(categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.name ?? categoryId.replace(/-/g, " ");
}

function withReason(product: ProductSummary, reason: string): RecommendedProduct {
  return { ...product, reason };
}

export interface RelatedProductsParams {
  productId: string;
  limit?: number;
}

export interface PersonalizedParams {
  categoryIds: string[];
  excludeIds?: string[];
  limit?: number;
}

export interface CartSuggestionsParams {
  cartProductIds: string[];
  limit?: number;
}

export const recommendationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // "Customers also considered" — same category, excluding the product itself.
    getRelatedProducts: builder.query<RecommendedProduct[], RelatedProductsParams>({
      queryFn: async ({ productId, limit = 4 }) => {
        const source = products.find((p) => p.id === productId);
        if (!source) return { data: [] };

        const sameCategory = products.filter(
          (p) => p.id !== productId && p.categoryId === source.categoryId
        );
        const related: RecommendedProduct[] = sameCategory
          .slice(0, limit)
          .map((p) => withReason(p, `Popular with ${categoryName(source.categoryId)} shoppers`));

        // Backfill with other products if the category is thin, so the rail
        // never looks sparse — reasoned differently since it's not actually
        // a category match.
        if (related.length < limit) {
          const usedIds = new Set(related.map((p) => p.id));
          const fallback = products
            .filter((p) => p.id !== productId && !usedIds.has(p.id))
            .slice(0, limit - related.length)
            .map((p) =>
              withReason(
                p,
                p.price < source.price ? "Great alternative at a lower price" : "Trending right now"
              )
            );
          related.push(...fallback);
        }
        return { data: await delay(related, 250) };
      },
      providesTags: (result) =>
        result ? result.map((p) => ({ type: "Recommendation" as const, id: p.id })) : [],
    }),

    // "Picked for you" — derived from categories the person has shown interest
    // in (wishlist + recently viewed), falling back to trending for new visitors.
    getPersonalizedProducts: builder.query<RecommendedProduct[], PersonalizedParams>({
      queryFn: async ({ categoryIds, excludeIds = [], limit = 4 }) => {
        let picks: RecommendedProduct[] = [];
        if (categoryIds.length > 0) {
          picks = products
            .filter((p) => categoryIds.includes(p.categoryId) && !excludeIds.includes(p.id))
            .map((p) => withReason(p, "Matches your recent interests"));
        }
        if (picks.length < limit) {
          const usedIds = new Set(picks.map((p) => p.id));
          const fallback = products
            .filter((p) => p.badge === "trending" && !excludeIds.includes(p.id) && !usedIds.has(p.id))
            .map((p) => withReason(p, "Trending right now"));
          picks = [...picks, ...fallback];
        }
        return { data: await delay(picks.slice(0, limit), 250) };
      },
    }),

    // Smart cart suggestions (MASTER_SPEC §24) — "Complete your setup" /
    // "Frequently bought with this item", surfaced on the Cart page.
    getCartSuggestions: builder.query<RecommendedProduct[], CartSuggestionsParams>({
      queryFn: async ({ cartProductIds, limit = 4 }) => {
        if (cartProductIds.length === 0) return { data: [] };
        const cartProducts = products.filter((p) => cartProductIds.includes(p.id));
        const cartCategoryIds = new Set(cartProducts.map((p) => p.categoryId));
        const hasConfigurableItem = cartProducts.some((p) => p.configuratorGroups);

        const suggestions = products
          .filter((p) => !cartProductIds.includes(p.id) && cartCategoryIds.has(p.categoryId))
          .slice(0, limit)
          .map((p) =>
            withReason(p, hasConfigurableItem ? "Complete your setup" : "Frequently bought with this item")
          );

        return { data: await delay(suggestions, 250) };
      },
    }),
  }),
});

export const {
  useGetRelatedProductsQuery,
  useGetPersonalizedProductsQuery,
  useGetCartSuggestionsQuery,
} = recommendationsApi;
