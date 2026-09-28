import "server-only";
import { isDeepStrictEqual } from "node:util";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { stripeCoupons } from "@/db/schema";
import type { CouponArchive } from "@/server/stripe/catalog";
import type { Coupon } from "@/server/stripe/types";

/** Coupons per insert, keeping statements small. */
const BATCH_SIZE = 1000;

/** The coupons read from a Stripe account, kept in the database (see `CouponArchive`). */
export function couponArchive(accountId: string): CouponArchive {
  const ofAccount = (couponIds: readonly string[]) =>
    and(eq(stripeCoupons.accountId, accountId), inArray(stripeCoupons.couponId, [...couponIds]));

  async function recall(ids: readonly string[]): Promise<Map<string, Coupon>> {
    if (!ids.length) return new Map();
    const rows = await db()
      .select({ id: stripeCoupons.couponId, terms: stripeCoupons.terms })
      .from(stripeCoupons)
      .where(ofAccount(ids));
    return new Map(rows.map(({ id, terms }) => [id, { ...terms, id }]));
  }

  return {
    accountId,
    recall,

    async remember(coupons) {
      // Scans list every coupon each time: most are unchanged, and only the others are written.
      const listed = new Map(coupons.map((coupon) => [coupon.id, coupon]));
      const known = await recall([...listed.keys()]);
      const added: Coupon[] = [];
      for (const coupon of listed.values()) {
        const previous = known.get(coupon.id);
        if (!previous) {
          added.push(coupon);
        } else if (!isDeepStrictEqual(previous, coupon)) {
          const { id, ...terms } = coupon;
          await db()
            .update(stripeCoupons)
            .set({ terms, updatedAt: new Date() })
            .where(ofAccount([id]));
        }
      }
      for (let start = 0; start < added.length; start += BATCH_SIZE) {
        await db()
          .insert(stripeCoupons)
          .values(
            added
              .slice(start, start + BATCH_SIZE)
              .map(({ id, ...terms }) => ({ accountId, couponId: id, terms })),
          );
      }
    },
  };
}
