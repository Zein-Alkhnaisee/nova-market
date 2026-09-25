import { baseApi } from "./baseApi";
import { reviews as mockReviews } from "../../mocks/data/reviews";
import { delay } from "../../lib/delay";
import { generateId } from "../../lib/id";
import type { RatingBreakdown, Review } from "../../types/review";

// In-memory store so newly submitted reviews persist for the session
// (not across reloads — this is a mock backend, not real persistence).
let reviewStore: Review[] = [...mockReviews];

function computeBreakdown(productReviews: Review[]): RatingBreakdown {
  const counts: RatingBreakdown["counts"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  productReviews.forEach((r) => {
    const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[rounded] += 1;
  });
  const total = productReviews.length;
  const average = total > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  return { average, total, counts };
}

export interface SubmitReviewInput {
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
}

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReviews: builder.query<{ reviews: Review[]; breakdown: RatingBreakdown }, string>({
      queryFn: async (productId) => {
        const productReviews = reviewStore
          .filter((r) => r.productId === productId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { data: await delay({ reviews: productReviews, breakdown: computeBreakdown(productReviews) }) };
      },
      providesTags: (_result, _error, productId) => [{ type: "Review", id: productId }],
    }),
    submitReview: builder.mutation<Review, SubmitReviewInput>({
      queryFn: async (input) => {
        const review: Review = {
          id: generateId("r"),
          productId: input.productId,
          author: input.author || "Anonymous",
          rating: input.rating,
          title: input.title,
          body: input.body,
          date: new Date().toISOString(),
          verified: false,
          helpfulCount: 0,
        };
        reviewStore = [review, ...reviewStore];
        return { data: await delay(review, 250) };
      },
      invalidatesTags: (_result, _error, input) => [{ type: "Review", id: input.productId }],
    }),
  }),
});

export const { useGetReviewsQuery, useSubmitReviewMutation } = reviewsApi;
