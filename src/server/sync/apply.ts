import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Transaction } from "@/db";
import { mrrMovements, payments, subscriptions, type dataOrigin } from "@/db/schema";
import { mainInterval, planName } from "@/server/stripe/mrr";
import type { Charge, UnixTime } from "@/server/stripe/types";
import type { EventRef } from "./events";
import {
  classifyChange,
  importedHistory,
  reconciledChangeTime,
  type PlannedMovement,
  type ValuedSubscription,
} from "./movements";

/** How data entered the database: only `live` rows trigger sounds and celebrations. */
export type DataOrigin = (typeof dataOrigin.enumValues)[number];

export interface SubscriptionUpdate extends ValuedSubscription {
  /** The event that revealed the change, for live updates. */
  event?: EventRef;
}

type SubscriptionRow = typeof subscriptions.$inferSelect;
type SubscriptionValues = Omit<typeof subscriptions.$inferInsert, "id" | "createdAt" | "updatedAt">;

const toDate = (time: UnixTime) => new Date(time * 1000);
const toOptionalDate = (time: UnixTime | null) => (time === null ? null : toDate(time));

/**
 * Mirrors subscriptions and records how their MRR changed, keeping the ledger equal to the sum of
 * the mirror. Stored rows are locked first, so a change is always compared with the latest stored
 * MRR and recorded once, even if syncs of the same account ever overlap.
 *
 * Unknown subscriptions get their whole history when found by a scan, and a single movement when
 * revealed by a live event.
 */
export async function applySubscriptionUpdates(
  tx: Transaction,
  accountId: string,
  updates: readonly SubscriptionUpdate[],
  origin: DataOrigin,
  now: UnixTime,
): Promise<number> {
  if (!updates.length) return 0;

  const storedRows = await tx
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.accountId, accountId),
        inArray(
          subscriptions.stripeSubscriptionId,
          updates.map((update) => update.subscription.id),
        ),
      ),
    )
    .for("update");
  const stored = new Map(storedRows.map((row) => [row.stripeSubscriptionId, row]));
  const comebacks = await subscriptionsWithHistory(
    tx,
    accountId,
    updates
      .filter((update) => update.mrr > 0 && stored.get(update.subscription.id)?.mrr === 0)
      .map((update) => update.subscription.id),
  );

  const inserts: SubscriptionValues[] = [];
  const movements: (typeof mrrMovements.$inferInsert)[] = [];
  for (const update of updates) {
    const previous = stored.get(update.subscription.id);
    const values = toSubscriptionValues(accountId, update, previous);
    if (!previous) {
      inserts.push(values);
    } else if (hasChanged(previous, values)) {
      await tx.update(subscriptions).set(values).where(eq(subscriptions.id, previous.id));
    }

    const planned =
      !previous && origin !== "live"
        ? importedHistory(update, now)
        : plannedChange(update, previous?.mrr ?? 0, comebacks.has(update.subscription.id), now);
    for (const movement of planned) {
      movements.push({
        accountId,
        stripeSubscriptionId: values.stripeSubscriptionId,
        stripeCustomerId: values.stripeCustomerId,
        customerName: values.customerName,
        customerCountry: values.customerCountry,
        planName: values.planName,
        kind: movement.kind,
        amount: movement.amount,
        currency: values.currency,
        occurredAt: toDate(movement.occurredAt),
        origin,
        stripeEventId: update.event?.id ?? null,
      });
    }
  }

  // A concurrent insert of the same subscription fails here, and the sync is retried later.
  if (inserts.length) await tx.insert(subscriptions).values(inserts);
  if (movements.length) await tx.insert(mrrMovements).values(movements);
  return movements.length;
}

function plannedChange(
  update: SubscriptionUpdate,
  previousMrr: number,
  hasHistory: boolean,
  now: UnixTime,
): PlannedMovement[] {
  const kind = classifyChange(previousMrr, update.mrr, hasHistory);
  if (!kind) return [];
  const occurredAt = update.event?.created ?? reconciledChangeTime(kind, update.subscription, now);
  return [{ kind, amount: update.mrr - previousMrr, occurredAt }];
}

/** Subscriptions that already have movements: paying again is a reactivation, not a new sale. */
async function subscriptionsWithHistory(
  tx: Transaction,
  accountId: string,
  subscriptionIds: string[],
): Promise<Set<string>> {
  if (!subscriptionIds.length) return new Set();
  const rows = await tx
    .selectDistinct({ id: mrrMovements.stripeSubscriptionId })
    .from(mrrMovements)
    .where(
      and(
        eq(mrrMovements.accountId, accountId),
        inArray(mrrMovements.stripeSubscriptionId, subscriptionIds),
      ),
    );
  return new Set(rows.map((row) => row.id));
}

function toSubscriptionValues(
  accountId: string,
  { subscription, mrr }: SubscriptionUpdate,
  previous: SubscriptionRow | undefined,
): SubscriptionValues {
  return {
    accountId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer.id,
    // Deleted customers lose their name: keep the one we knew.
    customerName: subscription.customer.name ?? previous?.customerName ?? null,
    customerCountry: subscription.customer.country ?? previous?.customerCountry ?? null,
    status: subscription.status,
    currency: subscription.currency,
    mrr,
    planName: planName(subscription),
    billingInterval: mainInterval(subscription),
    startedAt: toDate(subscription.startDate),
    trialEndsAt: toOptionalDate(subscription.trialEnd),
    canceledAt: toOptionalDate(subscription.canceledAt),
    endedAt: toOptionalDate(subscription.endedAt),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}

/** Skips writes for the many subscriptions a scan finds unchanged. */
function hasChanged(row: SubscriptionRow, values: SubscriptionValues): boolean {
  return (Object.keys(values) as (keyof SubscriptionValues)[]).some((key) => {
    const before = row[key];
    const after = values[key];
    return before instanceof Date && after instanceof Date
      ? before.getTime() !== after.getTime()
      : before !== after;
  });
}

/**
 * Records collected charges. A charge seen again (replayed event, refund) only updates its
 * amounts: it keeps its origin, so a payment is never celebrated twice.
 */
export async function applyCharges(
  tx: Transaction,
  accountId: string,
  charges: readonly Charge[],
  origin: DataOrigin,
): Promise<number> {
  const collected = charges.filter((charge) => charge.collected);
  if (!collected.length) return 0;

  const customers = await knownCustomers(
    tx,
    accountId,
    collected.flatMap((charge) =>
      charge.customerId && (!charge.customerName || !charge.country) ? [charge.customerId] : [],
    ),
  );
  const rows = collected.map((charge) => {
    const customer = charge.customerId ? customers.get(charge.customerId) : undefined;
    return {
      accountId,
      stripeChargeId: charge.id,
      stripeCustomerId: charge.customerId,
      customerName: charge.customerName ?? customer?.name ?? null,
      customerCountry: charge.country ?? customer?.country ?? null,
      description: charge.description,
      amount: charge.amount,
      amountRefunded: charge.amountRefunded,
      currency: charge.currency,
      occurredAt: toDate(charge.created),
      origin,
    };
  });

  const written = await tx
    .insert(payments)
    .values(rows)
    .onConflictDoUpdate({
      target: [payments.accountId, payments.stripeChargeId],
      set: {
        amount: sql`excluded.amount`,
        amountRefunded: sql`excluded.amount_refunded`,
        updatedAt: new Date(),
      },
      // Unchanged rows are neither written nor counted as changes.
      setWhere: sql`
        (${payments.amount}, ${payments.amountRefunded})
        is distinct from (excluded.amount, excluded.amount_refunded)
      `,
    })
    .returning({ id: payments.id });
  return written.length;
}

interface KnownCustomer {
  name: string | null;
  country: string | null;
}

/** Charges often lack a billing name: the customer's subscriptions know it. */
async function knownCustomers(
  tx: Transaction,
  accountId: string,
  customerIds: string[],
): Promise<Map<string, KnownCustomer>> {
  if (!customerIds.length) return new Map();
  const rows = await tx
    .selectDistinctOn([subscriptions.stripeCustomerId], {
      id: subscriptions.stripeCustomerId,
      name: subscriptions.customerName,
      country: subscriptions.customerCountry,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.accountId, accountId),
        inArray(subscriptions.stripeCustomerId, [...new Set(customerIds)]),
      ),
    );
  return new Map(rows.map((row) => [row.id, { name: row.name, country: row.country }]));
}
