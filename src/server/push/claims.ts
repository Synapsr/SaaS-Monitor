import "server-only";
import { and, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db, type Transaction } from "@/db";
import { customers, mrrMovements, payments, pushMilestones } from "@/db/schema";
import { DAY_MS } from "@/lib/durations";
import type { ActivityIds } from "@/server/display/queries";

/*
 * Every live row is claimed once, by the first sync to see it, whichever server runs it: no phone
 * hears of the same payment twice, however many displays poll or syncs are retried. Claims come
 * before sending, so a notification may be lost, never repeated.
 */

/**
 * Phones hear of what happened lately. A bank debit is dated when it started and collected days
 * later: that is news too, for a week.
 */
const MAX_AGE_MS = 7 * DAY_MS;

/**
 * Rows recorded lately that no sync claimed (the server stopped in between) are claimed by the
 * next one. Older ones, such as those recorded before phones could be notified, never are.
 */
const UNCLAIMED_FOR = sql`now(6) - interval 15 minute`;

type ActivityTable = typeof payments | typeof mrrMovements | typeof customers;

/** Claims the account's live rows no phone was told about yet, and returns their ids. */
export function claimLiveActivity(accountId: string, now: Date): Promise<ActivityIds> {
  return db().transaction(async (tx) => ({
    movements: await claim(tx, mrrMovements, accountId, now),
    payments: await claim(tx, payments, accountId, now),
    customers: await claim(tx, customers, accountId, now),
  }));
}

async function claim(
  tx: Transaction,
  table: ActivityTable,
  accountId: string,
  now: Date,
): Promise<string[]> {
  const rows = await tx
    .select({ id: table.id })
    .from(table)
    .where(
      and(
        eq(table.accountId, accountId),
        // On the `(account_id, occurred_at)` index.
        gte(table.occurredAt, new Date(now.getTime() - MAX_AGE_MS)),
        eq(table.origin, "live"),
        isNull(table.notifiedAt),
        gte(table.createdAt, UNCLAIMED_FOR),
      ),
    )
    // Rows another sync is claiming are its own.
    .for("update", { skipLocked: true });
  const ids = rows.map((row) => row.id);
  if (ids.length) {
    await tx
      .update(table)
      .set({ notifiedAt: sql`now(6)` })
      .where(inArray(table.id, ids));
  }
  return ids;
}

/**
 * Claims the milestones (moment ids, e.g. `milestone:mrr:1000000`) a screen's phones have not
 * heard of yet: each is notified once, even when MRR goes back and forth around it.
 */
export async function claimMilestones(
  screenId: string,
  milestones: readonly string[],
): Promise<Set<string>> {
  const claimed = new Set<string>();
  for (const milestone of milestones) {
    const [{ affectedRows }] = await db()
      .insert(pushMilestones)
      .ignore()
      .values({ screenId, milestone });
    if (affectedRows) claimed.add(milestone);
  }
  return claimed;
}
