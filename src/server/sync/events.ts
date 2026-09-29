import "server-only";
import { readEventSignal } from "@/server/stripe/normalize";
import type { Charge, Customer, StripeEvent, UnixTime } from "@/server/stripe/types";

/** The event behind a change, recorded with the movement it produces. */
export interface EventRef {
  id: string;
  created: UnixTime;
}

/** What the events of a batch say about a customer. */
export interface CustomerChange {
  /** Details from the latest event. */
  customer: Customer;
  event: EventRef;
  /** One of the events is the customer's creation: it signed up, and may be unknown here. */
  created: boolean;
}

/**
 * What a batch of events asks the sync to do, compact enough to digest thousands of events:
 * each subscription is fetched once, whatever the number of events about it.
 */
export interface EventDigest {
  /** Subscriptions to fetch again, with the latest event about each. */
  subscriptions: Map<string, EventRef>;
  /** Customers whose discount changed: it applies to each of their subscriptions. */
  customerDiscounts: Map<string, EventRef>;
  /** Latest known state of each charge. */
  charges: Map<string, { charge: Charge; event: EventRef }>;
  /** Customers created or updated, except deleted ones. */
  customers: Map<string, CustomerChange>;
  /** Customers deleted: whatever else the events say about them, they are gone. */
  deletedCustomers: Set<string>;
  /** Newest event listed, to move the cursor forward. */
  newest: EventRef | null;
  /** Every event listed, handled before or not: the next sync lists the latest ones again. */
  listed: EventRef[];
}

export function emptyDigest(): EventDigest {
  return {
    subscriptions: new Map(),
    customerDiscounts: new Map(),
    charges: new Map(),
    customers: new Map(),
    deletedCustomers: new Set(),
    newest: null,
    listed: [],
  };
}

/**
 * Adds events to a digest, except those an earlier sync `handled`: syncs read a little before
 * their cursor, and each event is only worth a request once. The Events API lists events newest
 * first: on equal timestamps the event seen first is kept as the latest.
 */
export function digestEvents(
  digest: EventDigest,
  events: readonly StripeEvent[],
  handled: ReadonlySet<string> = new Set(),
): EventDigest {
  for (const event of events) {
    const ref = { id: event.id, created: event.created };
    digest.listed.push(ref);
    if (!digest.newest || ref.created > digest.newest.created) digest.newest = ref;
    if (handled.has(event.id)) continue;

    const signal = readEventSignal(event);
    if (signal?.kind === "subscription") {
      keepLatest(digest.subscriptions, signal.subscriptionId, ref);
    } else if (signal?.kind === "discount") {
      if (signal.subscriptionId) keepLatest(digest.subscriptions, signal.subscriptionId, ref);
      else if (signal.customerId) keepLatest(digest.customerDiscounts, signal.customerId, ref);
    } else if (signal?.kind === "charge") {
      const known = digest.charges.get(signal.charge.id);
      if (!known || ref.created > known.event.created) {
        digest.charges.set(signal.charge.id, { charge: signal.charge, event: ref });
      }
    } else if (signal?.kind === "customer") {
      if (!digest.deletedCustomers.has(signal.customer.id)) {
        keepCustomer(digest.customers, signal.customer, signal.created, ref);
      }
    } else if (signal?.kind === "deleted-customer") {
      digest.customers.delete(signal.customerId);
      digest.deletedCustomers.add(signal.customerId);
    }
  }
  return digest;
}

function keepLatest(refs: Map<string, EventRef>, key: string, ref: EventRef) {
  const known = refs.get(key);
  if (!known || ref.created > known.created) refs.set(key, ref);
}

/** Keeps a customer's latest details, remembering whether any event was its creation. */
function keepCustomer(
  changes: Map<string, CustomerChange>,
  customer: Customer,
  created: boolean,
  ref: EventRef,
) {
  const known = changes.get(customer.id);
  const latest = !known || ref.created > known.event.created ? { customer, event: ref } : known;
  changes.set(customer.id, { ...latest, created: created || (known?.created ?? false) });
}
