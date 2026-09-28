import "server-only";
import { readEventSignal } from "@/server/stripe/normalize";
import type { Charge, StripeEvent, UnixTime } from "@/server/stripe/types";

/** The event behind a change, recorded with the movement it produces. */
export interface EventRef {
  id: string;
  created: UnixTime;
}

/**
 * What a batch of events asks the sync to do, compact enough to digest thousands of events:
 * each subscription is fetched once, whatever the number of events about it.
 */
export interface EventDigest {
  /** Subscriptions to fetch again, with the latest event about each. */
  subscriptions: Map<string, EventRef>;
  /** Customers whose discount changed: it applies to each of their subscriptions. */
  customers: Map<string, EventRef>;
  /** Latest known state of each charge. */
  charges: Map<string, { charge: Charge; event: EventRef }>;
  /** Newest event seen, to move the cursor forward. */
  newest: EventRef | null;
  count: number;
}

export function emptyDigest(): EventDigest {
  return {
    subscriptions: new Map(),
    customers: new Map(),
    charges: new Map(),
    newest: null,
    count: 0,
  };
}

/**
 * Adds events to a digest. The Events API lists them newest first: on equal timestamps the event
 * seen first is kept as the latest.
 */
export function digestEvents(digest: EventDigest, events: readonly StripeEvent[]): EventDigest {
  for (const event of events) {
    digest.count += 1;
    const ref = { id: event.id, created: event.created };
    if (!digest.newest || ref.created > digest.newest.created) digest.newest = ref;

    const signal = readEventSignal(event);
    if (signal?.kind === "subscription") {
      keepLatest(digest.subscriptions, signal.subscriptionId, ref);
    } else if (signal?.kind === "discount") {
      if (signal.subscriptionId) keepLatest(digest.subscriptions, signal.subscriptionId, ref);
      else if (signal.customerId) keepLatest(digest.customers, signal.customerId, ref);
    } else if (signal?.kind === "charge") {
      const known = digest.charges.get(signal.charge.id);
      if (!known || ref.created > known.event.created) {
        digest.charges.set(signal.charge.id, { charge: signal.charge, event: ref });
      }
    }
  }
  return digest;
}

function keepLatest(refs: Map<string, EventRef>, key: string, ref: EventRef) {
  const known = refs.get(key);
  if (!known || ref.created > known.created) refs.set(key, ref);
}
