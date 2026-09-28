import "server-only";
import { and, eq, inArray, lt } from "drizzle-orm";
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
 * revealed by a live event. Every subscription passed was just returned by Stripe (`lastSeenAt`).
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

  const seenAt = toDate(now);
  const inserts: SubscriptionValues[] = [];
  const unchanged: string[] = [];
  const movements: (typeof mrrMovements.$inferInsert)[] = [];
  for (const update of updates) {
    const previous = stored.get(update.subscription.id);
    const values = toSubscriptionValues(accountId, update, previous);
    if (!previous) {
      inserts.push({ ...values, lastSeenAt: seenAt });
    } else if (hasChanged(previous, values)) {
      await tx
        .update(subscriptions)
        .set({ ...values, lastSeenAt: seenAt })
        .where(eq(subscriptions.id, previous.id));
    } else {
      unchanged.push(previous.id);
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

  if (unchanged.length) {
    await tx
      .update(subscriptions)
      .set({ lastSeenAt: seenAt })
      .where(inArray(subscriptions.id, unchanged));
  }
  // A concurrent insert of the same subscription fails here, and the sync is retried later.
  if (inserts.length) await tx.insert(subscriptions).values(inserts);
  if (movements.length) await tx.insert(mrrMovements).values(movements);
  return movements.length;
}

/*
 * Only deleting test data removes subscriptions from Stripe. Those still mirrored end like a
 * cancellation: no MRR, and a churn movement so that the ledger keeps adding up to the mirror.
 */

/** Ends the subscriptions a live update could not retrieve, dated by the event naming each. */
export async function endMissingSubscriptions(
  tx: Transaction,
  accountId: string,
  events: ReadonlyMap<string, EventRef>,
  now: UnixTime,
): Promise<number> {
  if (!events.size) return 0;
  const rows = await tx
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.accountId, accountId),
        inArray(subscriptions.stripeSubscriptionId, [...events.keys()]),
      ),
    )
    .for("update");
  return endSubscriptions(tx, rows, "live", (row) => events.get(row.stripeSubscriptionId), now);
}

/**
 * Ends the subscriptions a complete scan did not see: Stripe has not returned them since the scan
 * started. Its pages ran over several syncs, and live updates may have seen others meanwhile.
 */
export async function endUnlistedSubscriptions(
  tx: Transaction,
  accountId: string,
  scanStartedAt: UnixTime,
  origin: DataOrigin,
  now: UnixTime,
): Promise<number> {
  const rows = await tx
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.accountId, accountId),
        // Both in whole seconds, like every `lastSeenAt`.
        lt(subscriptions.lastSeenAt, toDate(scanStartedAt)),
      ),
    )
    .for("update");
  return endSubscriptions(tx, rows, origin, () => undefined, now);
}

async function endSubscriptions(
  tx: Transaction,
  rows: readonly SubscriptionRow[],
  origin: DataOrigin,
  eventOf: (row: SubscriptionRow) => EventRef | undefined,
  now: UnixTime,
): Promise<number> {
  const movements: (typeof mrrMovements.$inferInsert)[] = [];
  for (const row of rows) {
    if (row.status === "canceled" && row.mrr === 0) continue;
    const event = eventOf(row);
    const endedAt = toDate(event?.created ?? now);
    await tx
      .update(subscriptions)
      .set({ status: "canceled", mrr: 0, endedAt: row.endedAt ?? endedAt })
      .where(eq(subscriptions.id, row.id));
    if (row.mrr === 0) continue;
    movements.push({
      accountId: row.accountId,
      stripeSubscriptionId: row.stripeSubscriptionId,
      stripeCustomerId: row.stripeCustomerId,
      customerName: row.customerName,
      customerCountry: row.customerCountry,
      planName: row.planName,
      kind: "churn",
      amount: -row.mrr,
      currency: row.currency,
      occurredAt: endedAt,
      origin,
      stripeEventId: event?.id ?? null,
    });
  }
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
 * Records collected charges and returns how many payments were added or changed. A charge seen
 * again (replayed event, refund) only updates its amounts: it keeps its origin, so a payment is
 * never celebrated twice. Stored rows are locked first, like subscriptions.
 */
export async function applyCharges(
  tx: Transaction,
  accountId: string,
  charges: readonly Charge[],
  origin: DataOrigin,
): Promise<number> {
  const collected = charges.filter((charge) => charge.collected);
  if (!collected.length) return 0;

  const chargeIds = collected.map((charge) => charge.id);
  const storedRows = await tx
    .select({
      id: payments.id,
      chargeId: payments.stripeChargeId,
      amount: payments.amount,
      amountRefunded: payments.amountRefunded,
    })
    .from(payments)
    .where(and(eq(payments.accountId, accountId), inArray(payments.stripeChargeId, chargeIds)))
    .for("update");
  const stored = new Map(storedRows.map((row) => [row.chargeId, row]));

  const added: Charge[] = [];
  let changed = 0;
  for (const charge of collected) {
    const previous = stored.get(charge.id);
    if (!previous) {
      added.push(charge);
    } else if (
      previous.amount !== charge.amount ||
      previous.amountRefunded !== charge.amountRefunded
    ) {
      await tx
        .update(payments)
        .set({ amount: charge.amount, amountRefunded: charge.amountRefunded })
        .where(eq(payments.id, previous.id));
      changed += 1;
    }
  }
  if (added.length) {
    // A concurrent insert of the same charge fails here, and the sync is retried later.
    await tx.insert(payments).values(await newPayments(tx, accountId, added, origin));
  }
  return added.length + changed;
}

/** Rows of charges seen for the first time, named after their customer when the charge is not. */
async function newPayments(
  tx: Transaction,
  accountId: string,
  charges: readonly Charge[],
  origin: DataOrigin,
): Promise<(typeof payments.$inferInsert)[]> {
  const customers = await knownCustomers(
    tx,
    accountId,
    charges.flatMap((charge) =>
      charge.customerId && (!charge.customerName || !charge.country) ? [charge.customerId] : [],
    ),
  );
  return charges.map((charge) => {
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
