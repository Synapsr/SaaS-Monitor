import { describe, expect, it } from "vitest";
import { SYNC_EVENT_TYPES } from "./event-types";
import { createStripeGateway } from "./gateway";

/*
 * Smoke test of the SDK gateway against stripe-mock (`pnpm db:up`), which validates request
 * parameters against Stripe's OpenAPI spec and answers with fixtures. It checks that requests and
 * expansions are valid, and that the schemas accept objects shaped like real Stripe responses.
 * Skipped when stripe-mock is not running, except in CI, which always provides it.
 */

const STRIPE_MOCK = {
  host: "127.0.0.1",
  port: Number(process.env.STRIPE_MOCK_PORT || 12111),
  protocol: "http",
} as const;

const isStripeMockRunning = await fetch(
  `${STRIPE_MOCK.protocol}://${STRIPE_MOCK.host}:${STRIPE_MOCK.port}/v1/charges`,
  { headers: { Authorization: "Bearer sk_test_123" }, signal: AbortSignal.timeout(1000) },
).then(
  (response) => response.ok,
  () => false,
);

describe.skipIf(!isStripeMockRunning && !process.env.CI)("Stripe gateway (stripe-mock)", () => {
  const gateway = createStripeGateway("sk_test_4eC39HqLyjWDarjtT1zdp7dc", STRIPE_MOCK);

  it("lists and retrieves subscriptions with their expansions", async () => {
    const page = await gateway.listSubscriptions();
    expect(page.data[0]).toMatchObject({ id: expect.any(String), items: expect.any(Array) });

    const next = await gateway.listSubscriptions(page.data[0].id);
    expect(next.data).toBeInstanceOf(Array);
    expect(await gateway.retrieveSubscription(page.data[0].id)).toMatchObject({
      id: expect.any(String),
    });
    expect((await gateway.listSubscriptionItems(page.data[0].id)).data[0]).toMatchObject({
      price: { id: expect.any(String) },
    });
  });

  it("lists charges, customers and events since a date", async () => {
    const since = Math.floor(Date.now() / 1000) - 3600;
    expect((await gateway.listCharges(since)).data[0]).toMatchObject({ id: expect.any(String) });
    expect((await gateway.listCustomers(since)).data[0]).toMatchObject({
      id: expect.any(String),
      created: expect.any(Number),
    });
    expect((await gateway.listEvents(SYNC_EVENT_TYPES, since)).data).toBeInstanceOf(Array);
  });

  it("reads the catalog", async () => {
    expect((await gateway.listProducts()).data[0]).toMatchObject({ name: expect.any(String) });
    expect((await gateway.listCoupons()).data[0]).toMatchObject({ id: expect.any(String) });
    expect(await gateway.retrieveCoupon("coupon_1")).toMatchObject({ id: expect.any(String) });
    expect(await gateway.retrievePrice("price_1", { tiers: true, currency: "eur" })).toMatchObject({
      id: expect.any(String),
    });
  });

  it("reads the account and probes every permission", async () => {
    expect(await gateway.retrieveAccount()).toMatchObject({ id: expect.stringMatching(/^acct_/) });
    for (const resource of [
      "subscriptions",
      "customers",
      "charges",
      "events",
      "products",
      "prices",
      "coupons",
    ] as const) {
      await gateway.probe(resource);
    }
  });

  it("sends valid webhook endpoint requests", async () => {
    // The request is accepted, but stripe-mock's fixture lacks the secret Stripe returns once.
    await expect(
      gateway.createWebhookEndpoint({
        url: "https://monitor.example.com/api/webhooks/stripe/1",
        events: SYNC_EVENT_TYPES,
        description: "SaaS Monitor",
        metadata: { app: "saas-monitor" },
      }),
    ).rejects.toThrow("did not return the webhook signing secret");
    await gateway.deleteWebhookEndpoint("we_123");
  });

  it("counts every request sent", () => {
    expect(gateway.requestCount).toBeGreaterThan(10);
  });
});
