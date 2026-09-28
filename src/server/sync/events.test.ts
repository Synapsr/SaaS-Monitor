import { describe, expect, it } from "vitest";
import type { StripeEvent } from "@/server/stripe/types";
import { JANUARY_1, stripeCharge } from "@/test/stripe-fixtures";
import { digestEvents, emptyDigest } from "./events";

let lastEvent = 0;
function event(type: string, object: unknown, created = JANUARY_1): StripeEvent {
  lastEvent += 1;
  return { id: `evt_${lastEvent}`, type, created, object };
}

describe("event digest", () => {
  it("fetches each changed subscription once, dated by its latest event", () => {
    const newer = event("customer.subscription.updated", { id: "sub_1" }, JANUARY_1 + 60);
    const digest = digestEvents(emptyDigest(), [
      newer,
      event("customer.subscription.created", { id: "sub_1" }, JANUARY_1),
      event("customer.subscription.deleted", { id: "sub_2" }),
    ]);

    expect([...digest.subscriptions.keys()]).toEqual(["sub_1", "sub_2"]);
    expect(digest.subscriptions.get("sub_1")).toEqual({ id: newer.id, created: JANUARY_1 + 60 });
    expect(digest).toMatchObject({ count: 3, newest: { id: newer.id } });
  });

  it("points discount events at their subscription, or at every subscription of the customer", () => {
    const digest = digestEvents(emptyDigest(), [
      event("customer.discount.created", { subscription: "sub_1", customer: "cus_1" }),
      event("customer.discount.deleted", { subscription: null, customer: "cus_2" }),
    ]);

    expect([...digest.subscriptions.keys()]).toEqual(["sub_1"]);
    expect([...digest.customers.keys()]).toEqual(["cus_2"]);
  });

  it("keeps the latest state of each charge", () => {
    const charge = stripeCharge({ id: "ch_1", amount: 5000 });
    const digest = digestEvents(emptyDigest(), [
      event("charge.refunded", { ...charge, amount_refunded: 5000 }, JANUARY_1 + 60),
      event("charge.succeeded", charge, JANUARY_1),
    ]);

    expect(digest.charges.get("ch_1")?.charge).toMatchObject({
      amount: 5000,
      amountRefunded: 5000,
    });
  });

  it("keeps the first listed event when timestamps are equal, as Stripe lists newest first", () => {
    const charge = stripeCharge({ id: "ch_1" });
    const digest = digestEvents(emptyDigest(), [
      event("charge.refunded", { ...charge, amount_refunded: 100 }),
      event("charge.succeeded", charge),
    ]);

    expect(digest.charges.get("ch_1")?.charge.amountRefunded).toBe(100);
  });

  it("accumulates pages and counts what it cannot read", () => {
    const digest = emptyDigest();
    digestEvents(digest, [event("customer.subscription.updated", { id: "sub_1" })]);
    digestEvents(digest, [event("customer.subscription.updated", { unexpected: true })]);

    expect(digest.count).toBe(2);
    expect(digest.subscriptions.size).toBe(1);
  });
});
