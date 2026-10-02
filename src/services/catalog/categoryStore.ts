/**
 * The category catalog — one store, shared by the storefront and the admin.
 *
 * Same pattern as `productStore.ts` (HANDOFF §8 #16): a plain module (not
 * Redux) that is the single source of truth; `mocks/data/categories.ts` is SEED
 * DATA ONLY; persisted under a versioned key with a seed fallback on any
 * empty/corrupt/mismatched storage; validation and constraints enforced HERE.
 *
 * LOAD-BEARING INVARIANT: a category's `id` always equals its `slug`.
 * The storefront resolves `/shop/:category` by slug and `productsApi` compares
 * that value against `product.categoryId`. Making the slug editable (or giving
 * new categories an id different from their slug) would silently break category
 * pages. So the slug is chosen once at creation (id = slug) and is not editable
 * afterwards; only name and image are.
 *
 * Constraint: a category can't be deleted while ANY product — including
 * archived ones — still belongs to it (409), because restoring an archived
 * product into a deleted category would orphan it.
 *
 * NOTE on the import cycle with `productStore.ts`: productStore validates a
 * product's category through `listCategories()`, and this module counts
 * products through `listProducts()`. Both are used only inside functions at
 * call time, never at module load, so the cycle is safe. Keep it that way: do
 * not call the other store at the top level of either module.
 */
import { loadPersisted, savePersisted } from "../../lib/persist";
import { categories as seedCategories } from "../../mocks/data/categories";
import { listProducts } from "./productStore";
import type { Category } from "../../types/product";

const STORAGE_KEY = "categories:v1";
const STORAGE_VERSION = 1;

export interface CategoryInput {
  name: string;
  /** Used on create only. Blank = generated from the name. Ignored by update (slug is fixed). */
  slug?: string;
  image?: string | null;
}

export type CategoryFieldError = "required" | "tooLong" | "invalidFormat" | "taken";

export type CategoryWriteResult =
  | { ok: true; category: Category }
  | { ok: false; status: 400 | 404 | 409; fields: Partial<Record<string, CategoryFieldError>> };

export type CategoryDeleteResult =
  | { ok: true; category: Category }
  | { ok: false; status: 404 }
  | { ok: false; status: 409; reason: "hasProducts"; productCount: number };

let cache: Category[] | null = null;

function isValidStored(value: unknown): value is Category[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (c) =>
        c !== null &&
        typeof c === "object" &&
        typeof (c as Category).id === "string" &&
        typeof (c as Category).slug === "string" &&
        typeof (c as Category).name === "string" &&
        (c as Category).id === (c as Category).slug
    )
  );
}

function load(): Category[] {
  const stored = loadPersisted<{ version?: number; items?: unknown } | null>(STORAGE_KEY, null);
  if (stored && stored.version === STORAGE_VERSION && isValidStored(stored.items)) return stored.items;
  return seedCategories.map((c) => ({ ...c }));
}

function items(): Category[] {
  if (!cache) cache = load();
  return cache;
}

function commit(next: Category[]) {
  cache = next;
  savePersisted(STORAGE_KEY, { version: STORAGE_VERSION, items: next });
}

export function listCategories(): Category[] {
  return [...items()];
}

export function getCategoryById(id: string): Category | undefined {
  return items().find((c) => c.id === id);
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

/** Products (including archived) that belong to a category. */
export function countProductsInCategory(id: string): number {
  return listProducts({ includeArchived: true }).filter((p) => p.categoryId === id).length;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateShared(input: CategoryInput, excludeId?: string) {
  const fields: Partial<Record<string, CategoryFieldError>> = {};
  const name = input.name?.trim() ?? "";
  if (!name) fields.name = "required";
  else if (name.length > 60) fields.name = "tooLong";
  else if (items().some((c) => c.id !== excludeId && c.name.trim().toLowerCase() === name.toLowerCase())) {
    fields.name = "taken";
  }
  const image = input.image?.trim() ?? "";
  if (image && !/^https?:\/\/\S+$/i.test(image)) fields.image = "invalidFormat";
  return { fields, name, image };
}

const failure = (fields: Partial<Record<string, CategoryFieldError>>): CategoryWriteResult => ({
  ok: false,
  status: Object.keys(fields).length === 1 && (fields.slug === "taken" || fields.name === "taken") ? 409 : 400,
  fields,
});

export function createCategory(input: CategoryInput): CategoryWriteResult {
  const { fields, name, image } = validateShared(input);
  const rawSlug = input.slug?.trim() ?? "";
  const slug = rawSlug || slugify(name);
  if (!fields.name || rawSlug) {
    if (!slug) fields.slug = "required";
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fields.slug = "invalidFormat";
    else if (items().some((c) => c.slug === slug || c.id === slug)) fields.slug = "taken";
  }
  if (Object.keys(fields).length > 0) return failure(fields);

  const category: Category = { id: slug, slug, name }; // id === slug: see the invariant above
  if (image) category.image = image;
  commit([...items(), category]);
  return { ok: true, category };
}

/** Name and image only — the slug (and so the id) never changes. */
export function updateCategory(id: string, input: Pick<CategoryInput, "name" | "image">): CategoryWriteResult {
  const existing = items().find((c) => c.id === id);
  if (!existing) return { ok: false, status: 404, fields: {} };
  const { fields, name, image } = validateShared(input, id);
  if (Object.keys(fields).length > 0) return failure(fields);

  const category: Category = { ...existing, name };
  if (image) category.image = image;
  else delete category.image;
  commit(items().map((c) => (c.id === id ? category : c)));
  return { ok: true, category };
}

export function deleteCategory(id: string): CategoryDeleteResult {
  const existing = items().find((c) => c.id === id);
  if (!existing) return { ok: false, status: 404 };
  const productCount = countProductsInCategory(id);
  if (productCount > 0) return { ok: false, status: 409, reason: "hasProducts", productCount };
  commit(items().filter((c) => c.id !== id));
  return { ok: true, category: existing };
}
