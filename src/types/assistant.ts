import type { ProductSummary } from "./product";

export type AssistantActionType =
  | "view_product"
  | "add_to_cart"
  | "add_to_compare"
  | "add_to_wishlist"
  | "view_comparison"
  | "search";

export interface AssistantAction {
  id: string;
  type: AssistantActionType;
  label: string;
  /** Product slug, product id, or search query — interpretation depends on `type`. */
  payload: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  products?: ProductSummary[];
  actions?: AssistantAction[];
}
