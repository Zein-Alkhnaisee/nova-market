/**
 * The product catalog — one store, shared by the storefront and the admin.
 *
 * HANDOFF §8 decision 16: this plain module is the single source of truth for
 * products. The storefront API modules (products, recommendations, search) and
 * the assistant read through `listProducts()`, and admin CRUD writes here. The
 * static `mocks/data/products` file is SEED DATA ONLY: it is used when nothing
 * valid is stored, and never read at runtime otherwise.
 *
 * It is deliberately NOT Redux: admin concerns must not pollute storefront
 * state. Storefront reactivity comes from RTK Query tag invalidation (see the
 * admin product mutations in `adminApi.ts`).
 *
 * Archive, not delete: archived products are hidden from every storefront read
 * (the filter lives here, in `listProducts`, nowhere else) but kept for admin
 * and restorable. Wishlists, collections and recently-viewed lists hold product
 * ids, and orders snapshot name/image/price, so history stays intact.
 *
 * Validation and constraints are enforced HERE (the "API layer"), not only in
 * the admin form — a real backend must do the same.
 *
 * Swapping in a real backend: replace this module; callers don't change.
 */
import { loadPersisted, savePersisted } from "../../lib/persist";
import { generateId } from "../../lib/id";
import { products as seedProducts } from "../../mocks/data/products";
import { categories } from "../../mocks/data/categories";
import type { ProductSummary } from "../../types/product";

/** localStorage key (`nova:` prefix is added by lib/persist). Bump the version when the shape changes. */
const STORAGE_KEY = "products:v1";
const STORAGE_VERSION = 1;
const BADGES: NonNullable<ProductSummary["badge"]>[] = ["new", "trending", "deal", "premium"];

export interface StoredProduct extends ProductSummary {
  /** ISO timestamp when archived. Absent = active. */
  archivedAt?: string;
  updatedAt?: string;
}

export interface ProductInput {
  name: string;
  /** Optional: generated from the name when blank. */
  slug?: string;
  brand: string;
  categoryId: string;
  price: number;
  previousPrice?: number | null;
  image: string;
  description?: string;
  /** Units on hand. Omit/null = not tracked (availability unchanged). */
  inventory?: number | null;
  badge?: ProductSummary["badge"] | null;
}

export type ProductFieldError =
  | "required"
  | "tooLong"
  | "invalidFormat"
  | "taken"
  | "unknownCategory"
  | "mustBePositive"
  | "mustExceedPrice"
  | "mustBeWholeNumber"
  | "invalidBadge";

export type ProductWriteResult =
  | { ok: true; product: StoredProduct }
  | { ok: false; status: 400 | 404 | 409; fields: Partial<Record<string, ProductFieldError>> };

interface ListOptions {
  /** Admin only. Storefront reads must never pass this. */
  includeArchived?: boolean;
}

let cache: StoredProduct[] | null = null;

function isValidStored(value: unknown): value is StoredProduct[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (p) =>
        p !== null &&
        typeof p === "object" &&
        typeof (p as StoredProduct).id === "string" &&
        typeof (p as StoredProduct).slug === "string" &&
        typeof (p as StoredProduct).name === "string" &&
        typeof (p as StoredProduct).brand === "string" &&
        typeof (p as StoredProduct).categoryId === "string" &&
        typeof (p as StoredProduct).image === "string" &&
        typeof (p as StoredProduct).price === "number" &&
        Number.isFinite((p as StoredProduct).price) &&
        typeof (p as StoredProduct).inStock === "boolean"
    )
  );
}

function loadCatalog(): StoredProduct[] {
  const stored = loadPersisted<{ version?: number; items?: unknown } | null>(STORAGE_KEY, null);
  if (stored && stored.version === STORAGE_VERSION && isValidStored(stored.items)) {
    return stored.items;
  }
  // Empty, corrupt, wrong version or wrong shape: fall back to the seed.
  return seedProducts.map((p) => ({ ...p }));
}

function items(): StoredProduct[] {
  if (!cache) cache = loadCatalog();
  return cache;
}

function commit(next: StoredProduct[]) {
  cache = next;
  savePersisted(STORAGE_KEY, { version: STORAGE_VERSION, items: next });
}

export function isArchived(product: StoredProduct): boolean {
  return product.archivedAt !== undefined;
}

/** Storefront-safe by default: archived products are excluded here, once. */
export function listProducts(options: ListOptions = {}): StoredProduct[] {
  return options.includeArchived ? [...items()] : items().filter((p) => !isArchived(p));
}

export function getProductById(id: string, options: ListOptions = {}): StoredProduct | undefined {
  const found = items().find((p) => p.id === id);
  if (!found) return undefined;
  return !options.includeArchived && isArchived(found) ? undefined : found;
}

/** Test/dev helper: forget in-memory state and stored edits; the next read re-seeds. */
export function resetStore(): void {
  cache = null;
  try {
    window.localStorage.removeItem(`nova:${STORAGE_KEY}`);
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validate(
  input: ProductInput,
  excludeId?: string
): { fields: Partial<Record<string, ProductFieldError>>; slug: string } {
  const fields: Partial<Record<string, ProductFieldError>> = {};

  const name = input.name?.trim() ?? "";
  if (!name) fields.name = "required";
  else if (name.length > 120) fields.name = "tooLong";

  if (!(input.brand?.trim() ?? "")) fields.brand = "required";
  else if (input.brand.trim().length > 60) fields.brand = "tooLong";

  if (!input.categoryId) fields.categoryId = "required";
  else if (!categories.some((c) => c.id === input.categoryId)) fields.categoryId = "unknownCategory";

  if (typeof input.price !== "number" || Number.isNaN(input.price)) fields.price = "required";
  else if (!Number.isFinite(input.price) || input.price <= 0) fields.price = "mustBePositive";

  if (input.previousPrice != null) {
    if (!Number.isFinite(input.previousPrice) || input.previousPrice <= 0) fields.previousPrice = "mustBePositive";
    else if (!fields.price && input.previousPrice <= input.price) fields.previousPrice = "mustExceedPrice";
  }

  const image = input.image?.trim() ?? "";
  if (!image) fields.image = "required";
  else if (!/^https?:\/\/\S+$/i.test(image)) fields.image = "invalidFormat";

  if (input.inventory != null) {
    if (!Number.isFinite(input.inventory) || !Number.isInteger(input.inventory) || input.inventory < 0) {
      fields.inventory = "mustBeWholeNumber";
    }
  }

  if (input.badge != null && !BADGES.includes(input.badge)) fields.badge = "invalidBadge";

  if ((input.description?.length ?? 0) > 2000) fields.description = "tooLong";

  const rawSlug = input.slug?.trim() ?? "";
  const slug = rawSlug || slugify(name);
  if (!fields.name || rawSlug) {
    if (!slug) fields.slug = "required";
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fields.slug = "invalidFormat";
    else if (items().some((p) => p.slug === slug && p.id !== excludeId)) fields.slug = "taken";
  }

  return { fields, slug };
}

function failure(fields: Partial<Record<string, ProductFieldError>>): ProductWriteResult {
  const keys = Object.keys(fields);
  const status = keys.length === 1 && fields.slug === "taken" ? 409 : 400;
  return { ok: false, status, fields };
}

function build(input: ProductInput, slug: string, base: StoredProduct): StoredProduct {
  const next: StoredProduct = {
    ...base,
    name: input.name.trim(),
    slug,
    brand: input.brand.trim(),
    categoryId: input.categoryId,
    price: Math.round(input.price * 100) / 100,
    image: input.image.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (input.previousPrice != null) next.previousPrice = Math.round(input.previousPrice * 100) / 100;
  else delete next.previousPrice;

  const description = input.description?.trim();
  if (description) next.description = description;
  else delete next.description;

  if (input.badge) next.badge = input.badge;
  else delete next.badge;

  if (input.inventory != null) {
    next.inventory = input.inventory;
    next.inStock = input.inventory > 0; // keep the storefront's flag consistent
  }

  // The gallery's first image is the main image. If the main image changed, a
  // stale gallery would keep showing the old one, so fall back to the main image.
  if (base.image !== next.image) delete next.images;

  return next;
}

export function createProduct(input: ProductInput): ProductWriteResult {
  const { fields, slug } = validate(input);
  if (Object.keys(fields).length > 0) return failure(fields);
  const base: StoredProduct = {
    id: generateId("prod"),
    slug,
    name: "",
    brand: "",
    categoryId: input.categoryId,
    price: 0,
    currency: "USD",
    rating: 0,
    reviewCount: 0,
    image: "",
    inStock: true,
  };
  const product = build(input, slug, base);
  commit([...items(), product]);
  return { ok: true, product };
}

export function updateProduct(id: string, input: ProductInput): ProductWriteResult {
  const existing = items().find((p) => p.id === id);
  if (!existing) return { ok: false, status: 404, fields: {} };
  const { fields, slug } = validate(input, id);
  if (Object.keys(fields).length > 0) return failure(fields);
  const product = build(input, slug, existing);
  commit(items().map((p) => (p.id === id ? product : p)));
  return { ok: true, product };
}

function setArchived(id: string, archived: boolean): ProductWriteResult {
  const existing = items().find((p) => p.id === id);
  if (!existing) return { ok: false, status: 404, fields: {} };
  if (isArchived(existing) === archived) return { ok: true, product: existing }; // idempotent
  const product: StoredProduct = { ...existing, updatedAt: new Date().toISOString() };
  if (archived) product.archivedAt = new Date().toISOString();
  else delete product.archivedAt;
  commit(items().map((p) => (p.id === id ? product : p)));
  return { ok: true, product };
}

export const archiveProduct = (id: string) => setArchived(id, true);
export const restoreProduct = (id: string) => setArchived(id, false);
