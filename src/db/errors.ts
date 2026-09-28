/**
 * Whether a query was refused by a unique index (MySQL's `ER_DUP_ENTRY`), e.g. when another
 * request inserted the same row first. Drizzle reports the driver's error as its `cause`.
 */
export function isDuplicateEntry(error: unknown): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ("code" in current && current.code === "ER_DUP_ENTRY") return true;
  }
  return false;
}
