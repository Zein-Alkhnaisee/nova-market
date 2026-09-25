export interface ProductVariantGroup {
  type: "color" | "size";
  label: string;
  options: string[];
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  previousPrice?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  description?: string;
  specs?: Record<string, string>;
  variants?: ProductVariantGroup[];
  configuratorGroups?: import("./configurator").ConfiguratorGroup[];
  badge?: "new" | "trending" | "deal" | "premium";
  inStock: boolean;
}

/**
 * A product plus a short, human-readable explanation for why it's being
 * recommended (MASTER_SPEC §89 — "Smart recommendation reasons"). Kept as a
 * separate type rather than an optional field on `ProductSummary` so it's
 * clear at a glance which queries produce reasoned recommendations and which
 * return plain product listings.
 */
export interface RecommendedProduct extends ProductSummary {
  reason: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  parentId?: string;
  image?: string;
}
