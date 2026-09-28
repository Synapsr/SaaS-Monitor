import { sql } from "drizzle-orm";
import { customType, datetime } from "drizzle-orm/mysql-core";

// Column types shared by the app's tables and Better Auth's.

/**
 * ASCII text compared byte for byte, for identifiers: UUIDs, tokens and the ids of Stripe objects
 * (`sub_…`, or coupon ids chosen by hand). MySQL's default collation ignores case, which would
 * take `SUMMER` for `summer`; one byte per character also keeps their indexes small.
 */
export const identifier = customType<{
  data: string;
  config: { length: number };
  configRequired: true;
}>({
  dataType: ({ length }) => `varchar(${length}) character set ascii collate ascii_bin`,
});

/** A UUID. The app creates them, so that inserts know their ids without reading them back. */
export const uuid = () => identifier({ length: 36 });

/**
 * An instant, stored in UTC: drizzle reads and writes these columns as UTC, and so does MySQL's
 * `now()` on the app's connections (see src/db/index.ts). Not a `timestamp`, which ends in 2038.
 * To the microsecond, like the database clock: rows created within the same millisecond keep
 * their order (dates from the app carry milliseconds).
 */
export function instant(name = "") {
  return datetime(name, { fsp: 6, mode: "date" });
}

/** Default of an instant: the time of the insert. `now()` alone would drop the fraction. */
export const now = sql`(now(6))`;
