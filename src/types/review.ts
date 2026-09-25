export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  helpfulCount: number;
}

export interface RatingBreakdown {
  average: number;
  total: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
}
