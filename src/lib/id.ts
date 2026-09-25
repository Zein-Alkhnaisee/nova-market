let counter = 0;

/**
 * Generates a unique id with the given prefix.
 *
 * Deliberately not `${prefix}-${Date.now()}`: two records created within the
 * same millisecond (entirely possible when a person adds two addresses in
 * quick succession, or when tests run back-to-back) would collide, and
 * anything keyed by id — React list keys, "set this one as default", "remove
 * this one" — would then operate on the wrong record. A monotonic counter
 * combined with the timestamp makes collisions impossible within a session.
 */
export function generateId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
