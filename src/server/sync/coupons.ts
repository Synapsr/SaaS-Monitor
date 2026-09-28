import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { stripeCoupons } from "@/db/schema";
import type { CouponArchive } from "@/server/stripe/catalog";

/** Coupons per insert, far below PostgreSQL's limit of 65,535 parameters. */
const BATCH_SIZE = 1000;

/** The coupons read from a Stripe account, kept in the database (see `CouponArchive`). */
export function couponArchive(accountId: string): CouponArchive {
  return {
    accountId,

    async recall(ids) {
      if (!ids.length) return new Map();
      const rows = await db()
        .select({ id: stripeCoupons.couponId, terms: stripeCoupons.terms })
        .from(stripeCoupons)
        .where(
          and(eq(stripeCoupons.accountId, accountId), inArray(stripeCoupons.couponId, [...ids])),
        );
      return new Map(rows.map(({ id, terms }) => [id, { ...terms, id }]));
    },

    async remember(coupons) {
      // One row per coupon: an insert may not update the same row twice.
      const unique = [...new Map(coupons.map((coupon) => [coupon.id, coupon])).values()];
      for (let start = 0; start < unique.length; start += BATCH_SIZE) {
        await db()
          .insert(stripeCoupons)
          .values(
            unique
              .slice(start, start + BATCH_SIZE)
              .map(({ id, ...terms }) => ({ accountId, couponId: id, terms })),
          )
          .onConflictDoUpdate({
            target: [stripeCoupons.accountId, stripeCoupons.couponId],
            set: { terms: sql`excluded.terms`, updatedAt: new Date() },
            // Scans list every coupon each time: most are unchanged.
            setWhere: sql`${stripeCoupons.terms} is distinct from excluded.terms`,
          });
      }
    },
  };
}
