import type { Category } from "../../types/product";

// Extensible category system — new categories can be appended without any
// component change, per MASTER_SPEC section 4 ("category architecture must
// be extensible; do NOT hard-code category-specific UI").
export const categories: Category[] = [
  { id: "electronics", slug: "electronics", name: "Electronics" },
  { id: "computers", slug: "computers", name: "Computers" },
  { id: "gaming", slug: "gaming", name: "Gaming" },
  { id: "fashion", slug: "fashion", name: "Fashion" },
  { id: "watches-jewelry", slug: "watches-jewelry", name: "Watches & Jewelry" },
  { id: "beauty", slug: "beauty", name: "Beauty" },
  { id: "home", slug: "home", name: "Home" },
  { id: "sports-fitness", slug: "sports-fitness", name: "Sports & Fitness" },
  { id: "books-education", slug: "books-education", name: "Books & Education" },
  { id: "toys-kids", slug: "toys-kids", name: "Toys & Kids" },
  { id: "automotive", slug: "automotive", name: "Automotive" },
  { id: "office", slug: "office", name: "Office" },
  { id: "travel", slug: "travel", name: "Travel" },
  { id: "pets", slug: "pets", name: "Pets" },
  { id: "lifestyle", slug: "lifestyle", name: "Lifestyle" },
];
