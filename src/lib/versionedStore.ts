/**
 * Shared plumbing for the admin-managed catalog stores (products, categories,
 * coupons) — extracted at the third store, as HANDOFF §8 #17 planned.
 *
 * Each store keeps its own types, validation rules and constraints; this helper
 * only owns the persistence pattern they all share:
 *   - an in-memory cache, loaded lazily on first read;
 *   - a versioned localStorage envelope `{ version, items }` under `nova:<key>`;
 *   - a seed fallback when storage is empty, unparseable, the wrong version, or
 *     fails the store's own shape check (corrupt data never crashes the app);
 *   - `reset()` for tests/dev: forget the cache and the stored data.
 *
 * Bump `version` (and the key's `:vN` suffix) when a store's item shape changes,
 * so old data is ignored instead of silently misread.
 */
import { loadPersisted, savePersisted } from "./persist";

interface VersionedStoreOptions<T> {
  /** Storage key WITHOUT the `nova:` prefix, e.g. "products:v1". */
  key: string;
  version: number;
  /** A fresh copy of the seed data (so the static seed is never mutated). */
  seed: () => T[];
  /** Validates a stored list's shape. A list that fails is discarded for the seed. */
  isValid: (items: unknown) => items is T[];
}

export interface VersionedStore<T> {
  /** The current items (cached; never a copy — callers must not mutate it). */
  read(): T[];
  /** Replace the items, cache them, and persist. */
  write(next: T[]): void;
  /** Forget the cache and delete the stored data; the next read re-seeds. */
  reset(): void;
}

export function createVersionedStore<T>({ key, version, seed, isValid }: VersionedStoreOptions<T>): VersionedStore<T> {
  let cache: T[] | null = null;

  function load(): T[] {
    const stored = loadPersisted<{ version?: number; items?: unknown } | null>(key, null);
    if (stored && stored.version === version && isValid(stored.items)) return stored.items;
    return seed();
  }

  return {
    read() {
      if (!cache) cache = load();
      return cache;
    },
    write(next) {
      cache = next;
      savePersisted(key, { version, items: next });
    },
    reset() {
      cache = null;
      try {
        // Same `nova:` prefix lib/persist applies to every key.
        window.localStorage.removeItem(`nova:${key}`);
      } catch {
        // Storage unavailable — nothing to clear.
      }
    },
  };
}
