import { describe, expect, it } from "vitest";
import { DAY_SECONDS } from "@/lib/durations";
import { subscriptionSchema } from "@/server/stripe/normalize";
import {
  couponMap,
  JANUARY_1,
  monthlyPrice,
  stripeCoupon,
  stripeDiscount,
  stripeItem,
  stripeSubscription,
  type SubscriptionFixture,
} from "@/test/stripe-fixtures";
import {
  churnReason,
  classifyChange,
  importedHistory,
  payingSince,
  reconciledChangeTime,
  stoppedPayingAt,
  valueSubscription,
} from "./movements";

const NOW = JANUARY_1 + 60 * DAY_SECONDS;
const subscription = (fixture: SubscriptionFixture = {}) =>
  subscriptionSchema.parse(stripeSubscription(fixture));

describe("movement kinds", () => {
  it("classifies changes of MRR", () => {
    expect(classifyChange(0, 4900, false)).toBe("new");
    expect(classifyChange(0, 4900, true)).toBe("reactivation");
    expect(classifyChange(4900, 9800, true)).toBe("expansion");
    expect(classifyChange(9800, 4900, true)).toBe("contraction");
    expect(classifyChange(4900, 0, true)).toBe("churn");
    expect(classifyChange(4900, 4900, true)).toBeNull();
    expect(classifyChange(0, 0, false)).toBeNull();
  });
});

describe("paying period", () => {
  it("starts with the subscription, or when its trial converted", () => {
    expect(payingSince(subscription(), NOW)).toBe(JANUARY_1);
    expect(payingSince(subscription({ trial_end: JANUARY_1 + 14 * DAY_SECONDS }), NOW)).toBe(
      JANUARY_1 + 14 * DAY_SECONDS,
    );
  });

  it("never started for trials, failed first payments and unconverted trials", () => {
    for (const status of ["trialing", "incomplete", "incomplete_expired", "paused"]) {
      expect(payingSince(subscription({ status }), NOW), status).toBeNull();
    }
    const trialEnd = JANUARY_1 + 14 * DAY_SECONDS;
    expect(
      payingSince(
        subscription({ status: "canceled", trial_end: trialEnd, ended_at: trialEnd }),
        NOW,
      ),
    ).toBeNull();
  });

  it("stops when a cancellation at period end is requested", () => {
    const requested = subscription({
      cancel_at_period_end: true,
      canceled_at: JANUARY_1 + 20 * DAY_SECONDS,
      ended_at: JANUARY_1 + 31 * DAY_SECONDS,
    });
    expect(stoppedPayingAt(requested, NOW)).toBe(JANUARY_1 + 20 * DAY_SECONDS);
  });

  it("stops when the subscription ended, or during its current period when unpaid", () => {
    expect(
      stoppedPayingAt(subscription({ status: "canceled", ended_at: NOW - DAY_SECONDS }), NOW),
    ).toBe(NOW - DAY_SECONDS);
    const unpaid = subscription({
      status: "unpaid",
      items: [stripeItem({ current_period_start: NOW - 5 * DAY_SECONDS })],
    });
    expect(stoppedPayingAt(unpaid, NOW)).toBe(NOW - 5 * DAY_SECONDS);
  });
});

describe("imported history", () => {
  const valued = (fixture: SubscriptionFixture) =>
    valueSubscription(subscription(fixture), new Map(), NOW);

  it("starts a paying subscription at its first payment", () => {
    expect(
      importedHistory(valued({ items: [stripeItem({ price: monthlyPrice(4900) })] }), NOW),
    ).toEqual([{ kind: "new", amount: 4900, occurredAt: JANUARY_1 }]);
  });

  it("adds a churn to subscriptions that stopped paying, netting to zero", () => {
    const history = importedHistory(
      valued({
        status: "canceled",
        ended_at: NOW - DAY_SECONDS,
        items: [stripeItem({ price: monthlyPrice(4900) })],
      }),
      NOW,
    );
    expect(history).toEqual([
      { kind: "new", amount: 4900, occurredAt: JANUARY_1 },
      { kind: "churn", amount: -4900, occurredAt: NOW - DAY_SECONDS },
    ]);
  });

  it("has no history for subscriptions that never paid or are free", () => {
    expect(importedHistory(valued({ status: "trialing" }), NOW)).toEqual([]);
    expect(
      importedHistory(valued({ items: [stripeItem({ price: monthlyPrice(0) })] }), NOW),
    ).toEqual([]);
  });

  it("values a churned subscription with the discounts it had when it stopped", () => {
    const coupon = stripeCoupon({ percent_off: 50, duration: "repeating" });
    const ended = subscription({
      status: "canceled",
      ended_at: JANUARY_1 + 20 * DAY_SECONDS,
      discounts: [stripeDiscount(coupon, { end: JANUARY_1 + 30 * DAY_SECONDS })],
      items: [stripeItem({ price: monthlyPrice(4000) })],
    });
    expect(valueSubscription(ended, couponMap([coupon]), NOW)).toMatchObject({
      mrr: 0,
      potential: 2000,
    });
  });
});

describe("reconciled changes", () => {
  it("dates starts and ends from Stripe, other changes when found", () => {
    const ended = subscription({ status: "canceled", ended_at: NOW - 3 * DAY_SECONDS });
    expect(reconciledChangeTime("churn", ended, NOW)).toBe(NOW - 3 * DAY_SECONDS);
    expect(reconciledChangeTime("new", subscription({ trial_end: NOW - DAY_SECONDS }), NOW)).toBe(
      NOW - DAY_SECONDS,
    );
    expect(reconciledChangeTime("expansion", subscription(), NOW)).toBe(NOW);
    expect(reconciledChangeTime("reactivation", subscription(), NOW)).toBe(NOW);
  });
});

describe("churn reasons", () => {
  it("tell a cancellation, one at period end, a failed payment and a pause apart", () => {
    expect(churnReason(subscription({ status: "canceled" }))).toBe("canceled");
    expect(churnReason(subscription({ status: "incomplete_expired" }))).toBe("canceled");
    expect(churnReason(subscription({ cancel_at_period_end: true }))).toBe("scheduled");
    expect(churnReason(subscription({ status: "past_due", cancel_at_period_end: true }))).toBe(
      "scheduled",
    );
    expect(churnReason(subscription({ status: "unpaid" }))).toBe("unpaid");
    expect(churnReason(subscription({ status: "paused" }))).toBe("paused");
  });

  it("are unknown for a subscription that runs without bringing MRR", () => {
    expect(churnReason(subscription({ status: "active" }))).toBeNull();
  });
});
