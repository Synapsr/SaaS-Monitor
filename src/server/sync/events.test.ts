import { describe, expect, it } from "vitest";
import type { StripeEvent } from "@/server/stripe/types";
import { JANUARY_1, stripeCharge, stripeCustomer } from "@/test/stripe-fixtures";
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
    expect(digest.newest).toMatchObject({ id: newer.id });
  });

  it("points discount events at their subscription, or at every subscription of the customer", () => {
    const digest = digestEvents(emptyDigest(), [
      event("customer.discount.created", { subscription: "sub_1", customer: "cus_1" }),
      event("customer.discount.deleted", { subscription: null, customer: "cus_2" }),
    ]);

    expect([...digest.subscriptions.keys()]).toEqual(["sub_1"]);
    expect([...digest.customerDiscounts.keys()]).toEqual(["cus_2"]);
    expect(digest.customers.size).toBe(0);
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

  it("keeps the latest details of each customer, and whether it was created", () => {
    const signUp = stripeCustomer({ id: "cus_new", name: null, country: null });
    const digest = digestEvents(emptyDigest(), [
      // The checkout names the customer a moment after creating them.
      event("customer.updated", { ...signUp, name: "Ada Lovelace" }, JANUARY_1 + 5),
      event("customer.created", signUp, JANUARY_1),
      event("customer.updated", stripeCustomer({ id: "cus_old", name: "Grace Hopper" })),
    ]);

    expect(digest.customers.get("cus_new")).toMatchObject({
      customer: { name: "Ada Lovelace" },
      event: { created: JANUARY_1 + 5 },
      created: true,
    });
    expect(digest.customers.get("cus_old")).toMatchObject({
      customer: { name: "Grace Hopper" },
      created: false,
    });
  });

  it("forgets deleted customers, whatever the order of their events", () => {
    const spam = stripeCustomer({ id: "cus_spam" });
    const digest = digestEvents(emptyDigest(), [
      event("customer.updated", spam),
      event("customer.deleted", spam),
      event("customer.created", spam),
    ]);

    expect(digest.customers.size).toBe(0);
    expect([...digest.deletedCustomers]).toEqual(["cus_spam"]);
  });

  it("lists the events an earlier sync handled, without acting on them again", () => {
    const handled = event("customer.subscription.updated", { id: "sub_1" }, JANUARY_1 + 60);
    const late = event("customer.subscription.updated", { id: "sub_2" }, JANUARY_1);
    const digest = digestEvents(emptyDigest(), [handled, late], new Set([handled.id]));

    expect([...digest.subscriptions.keys()]).toEqual(["sub_2"]);
    expect(digest.listed.map((ref) => ref.id)).toEqual([handled.id, late.id]);
    expect(digest.newest).toMatchObject({ id: handled.id });
  });

  it("accumulates pages and skips events it cannot read", () => {
    const digest = emptyDigest();
    digestEvents(digest, [event("customer.subscription.updated", { id: "sub_1" })]);
    digestEvents(digest, [event("customer.subscription.updated", { unexpected: true })]);

    expect(digest.subscriptions.size).toBe(1);
  });
});
