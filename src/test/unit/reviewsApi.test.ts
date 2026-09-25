import { describe, expect, it, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { reviewsApi } from "../../services/api/reviewsApi";

function createTestStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

describe("reviewsApi", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it("returns reviews for a product sorted newest first", async () => {
    const result = await store.dispatch(reviewsApi.endpoints.getReviews.initiate("p1"));
    expect(result.data?.reviews.length).toBeGreaterThan(0);
    expect(result.data?.reviews.every((r) => r.productId === "p1")).toBe(true);
    const dates = result.data?.reviews.map((r) => new Date(r.date).getTime()) ?? [];
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it("computes an accurate rating breakdown", async () => {
    const result = await store.dispatch(reviewsApi.endpoints.getReviews.initiate("p1"));
    const breakdown = result.data?.breakdown;
    expect(breakdown?.total).toBe(result.data?.reviews.length);
    const sumOfCounts = Object.values(breakdown?.counts ?? {}).reduce((a, b) => a + b, 0);
    expect(sumOfCounts).toBe(breakdown?.total);
  });

  it("returns an empty breakdown for a product with no reviews", async () => {
    const result = await store.dispatch(reviewsApi.endpoints.getReviews.initiate("no-such-product"));
    expect(result.data?.reviews).toEqual([]);
    expect(result.data?.breakdown.total).toBe(0);
    expect(result.data?.breakdown.average).toBe(0);
  });

  it("submitting a review makes it appear in a subsequent getReviews call", async () => {
    await store.dispatch(
      reviewsApi.endpoints.submitReview.initiate({
        productId: "p3",
        author: "Test User",
        rating: 5,
        title: "Great!",
        body: "Really happy with this.",
      })
    );
    const result = await store.dispatch(
      reviewsApi.endpoints.getReviews.initiate("p3", { forceRefetch: true })
    );
    expect(result.data?.reviews.some((r) => r.title === "Great!")).toBe(true);
  });
});
