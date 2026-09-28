import "server-only";
import type { MrrMovementKind } from "@/lib/display/types";
import { contributesToMrr, potentialMrr, subscriptionMrr } from "@/server/stripe/mrr";
import type { Coupon, Subscription, UnixTime } from "@/server/stripe/types";

/*
 * Rules deciding which MRR movements a subscription produces and when. The ledger they feed must
 * always add up to the current MRR of each subscription: the display rebuilds history from it.
 */

/** A subscription as the sync engine sees it: what it is worth now and while it paid. */
export interface ValuedSubscription {
  subscription: Subscription;
  /** Current contribution to MRR. */
  mrr: number;
  /** MRR while it was paying: equals `mrr` for a paying subscription. */
  potential: number;
}

export interface PlannedMovement {
  kind: MrrMovementKind;
  amount: number;
  occurredAt: UnixTime;
}

// These statuses mean the subscription never produced revenue: a trial that has not converted,
// a first payment that never succeeded, or a trial that ended without a payment method.
const NEVER_PAID_STATUSES = new Set(["trialing", "incomplete", "incomplete_expired", "paused"]);

export function valueSubscription(
  subscription: Subscription,
  coupons: ReadonlyMap<string, Coupon>,
  now: UnixTime,
): ValuedSubscription {
  if (contributesToMrr(subscription)) {
    const mrr = subscriptionMrr(subscription, { coupons, at: now });
    return { subscription, mrr, potential: mrr };
  }
  // Discounts are evaluated when it stopped paying: a repeating coupon may have ended since.
  const at = stoppedPayingAt(subscription, now);
  return { subscription, mrr: 0, potential: potentialMrr(subscription, { coupons, at }) };
}

/** When the subscription started paying (its trial end, if any), or `null` if it never did. */
export function payingSince(subscription: Subscription, now: UnixTime): UnixTime | null {
  if (NEVER_PAID_STATUSES.has(subscription.status)) return null;
  const { trialEnd, endedAt } = subscription;
  if (trialEnd === null) return subscription.startDate;
  // A subscription that ended exactly when its trial did never converted.
  const converted = endedAt === null ? trialEnd <= now : trialEnd < endedAt;
  return converted ? trialEnd : null;
}

/** When a subscription that no longer counts stopped counting: its most plausible churn time. */
export function stoppedPayingAt(subscription: Subscription, now: UnixTime): UnixTime {
  // Stripe stops counting a cancellation at period end when it is requested.
  if (subscription.cancelAtPeriodEnd && subscription.canceledAt) return subscription.canceledAt;
  const time =
    subscription.endedAt ??
    subscription.canceledAt ??
    // `unpaid` subscriptions stop being paid during their current period.
    subscription.items[0]?.currentPeriodStart ??
    now;
  return Math.min(time, now);
}

/**
 * History of a subscription seen for the first time by a full scan: `new` when it started paying
 * and, if it no longer counts, `churn` when it stopped. Upgrades and downgrades that happened
 * before the import are unknown to Stripe's API, so history uses the latest amount.
 */
export function importedHistory(valued: ValuedSubscription, now: UnixTime): PlannedMovement[] {
  const { subscription, mrr, potential } = valued;
  const since = payingSince(subscription, now);
  if (mrr > 0) {
    return [{ kind: "new", amount: mrr, occurredAt: since ?? subscription.startDate }];
  }
  if (since === null || potential === 0) return [];
  const stoppedAt = Math.max(since, stoppedPayingAt(subscription, now));
  return [
    { kind: "new", amount: potential, occurredAt: since },
    { kind: "churn", amount: -potential, occurredAt: stoppedAt },
  ];
}

/** Kind of an MRR change; `hasHistory` tells a comeback from a first payment. */
export function classifyChange(
  previous: number,
  next: number,
  hasHistory: boolean,
): MrrMovementKind | null {
  if (next === previous) return null;
  if (previous === 0) return hasHistory ? "reactivation" : "new";
  if (next === 0) return "churn";
  return next > previous ? "expansion" : "contraction";
}

/**
 * When a change found by a reconcile (not announced by an event) most likely happened: a start or
 * an end is dated by Stripe, other changes are dated when found.
 */
export function reconciledChangeTime(
  kind: MrrMovementKind,
  subscription: Subscription,
  now: UnixTime,
): UnixTime {
  if (kind === "new") return payingSince(subscription, now) ?? now;
  if (kind === "churn") {
    const since = payingSince(subscription, now);
    const stoppedAt = stoppedPayingAt(subscription, now);
    return since === null ? stoppedAt : Math.max(since, stoppedAt);
  }
  return now;
}
