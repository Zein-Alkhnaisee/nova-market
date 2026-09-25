export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  quantity: number;
  /** Human-readable summary of a configured product's selected options, if any (MASTER_SPEC §32). */
  configurationSummary?: string;
}
