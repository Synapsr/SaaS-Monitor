import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { stripeAccounts } from "@/db/schema";
import { encryptSecret } from "@/server/crypto";
import { getDisplayStateByToken } from "@/server/display/state";
import { connectRevenueCatAccount } from "@/server/revenuecat/accounts";
import type { RevenueCatGateway } from "@/server/revenuecat/gateway";
import { revenueCatSecretKeySchema } from "@/server/revenuecat/keys";
import { receiveRevenueCatWebhook } from "@/server/revenuecat/webhooks";
import { createScreen } from "@/server/screens";
import { listStripeAccountSummaries } from "@/server/stripe/accounts";
import { syncAccount } from "@/server/sync/run";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";

vi.mock("next/server", () => ({ after: vi.fn() }));

const NOW = new Date("2026-11-25T12:00:00.000Z");

function fakeRevenueCatGateway(): RevenueCatGateway {
  const dayToday = Date.UTC(2026, 10, 25) / 1000;
  const dayYesterday = Date.UTC(2026, 10, 24) / 1000;
  let requests = 0;

  return {
    get requestCount() {
      return requests;
    },
    async listProjects() {
      requests += 1;
      return [{ id: "proj_rc_1", name: "Mobile App" }];
    },
    async getOverviewMetrics() {
      requests += 1;
      return {
        currency: "usd",
        mrr: 50000,
        activeSubscriptions: 25,
        activeTrials: 4,
        updatedAt: new Date("2026-11-25T11:00:00.000Z"),
      };
    },
    async getChartData(_projectId, chartName) {
      requests += 1;
      if (chartName === "mrr_movement") {
        return {
          currency: "usd",
          resolution: "day",
          measures: [
            { displayName: "New MRR", unit: "$", chartable: true },
            { displayName: "Churned MRR", unit: "$", chartable: true },
          ],
          values: [
            { cohort: dayYesterday, measure: 0, value: 40 },
            { cohort: dayToday, measure: 0, value: 20 },
            { cohort: dayToday, measure: 1, value: 10 },
          ],
        };
      }
      if (chartName === "revenue") {
        return {
          currency: "usd",
          resolution: "day",
          measures: [{ displayName: "Revenue", unit: "$", chartable: true }],
          values: [
            { cohort: dayYesterday, measure: 0, value: 120 },
            { cohort: dayToday, measure: 0, value: 80 },
          ],
        };
      }
      if (chartName === "actives_new") {
        return {
          currency: "usd",
          resolution: "day",
          measures: [{ displayName: "New Paid Subscriptions", unit: "#", chartable: true }],
          values: [[dayToday, 3]],
        };
      }
      return {
        currency: "usd",
        resolution: "day",
        measures: [{ displayName: "New Customers", unit: "#", chartable: true }],
        values: [[dayToday, 11]],
      };
    },
    async listProducts() {
      requests += 1;
      return [
        {
          id: "prod_1",
          storeIdentifier: "com.acme.pro_monthly",
          displayName: "Pro Monthly",
          type: "subscription",
          duration: "P1M",
        },
      ];
    },
    async createWebhookIntegration() {
      requests += 1;
      return { id: "wh_rc_1", signingSecret: "rc_hmac_secret" };
    },
    async deleteWebhookIntegration() {
      requests += 1;
    },
  };
}

describe("RevenueCat end-to-end sync, webhooks, and display state", () => {
  beforeEach(resetDatabase);

  it("imports RevenueCat metrics, applies a live webhook, and computes display state", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const gateway = fakeRevenueCatGateway();

    const connected = await connectRevenueCatAccount(
      {
        workspaceId,
        name: "Acme iOS",
        secretKey: revenueCatSecretKeySchema.parse("sk_AbCdEfGhIjKlMnOp1234"),
      },
      { createGateway: () => gateway },
    );
    expect(connected.ok).toBe(true);
    if (!connected.ok) return;

    const report = await syncAccount(connected.accountId, {
      createRevenueCatGateway: () => gateway,
      now: () => NOW,
    });
    expect(report?.ok).toBe(true);

    const summaries = await listStripeAccountSummaries(workspaceId);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      provider: "revenuecat",
      name: "Acme iOS",
      status: "ready",
      mrr: { amount: 50000, currency: "usd" },
    });

    // Configure a manual webhook secret and send a live INITIAL_PURCHASE after overviewUpdatedAt.
    await db()
      .update(stripeAccounts)
      .set({ encryptedWebhookSecret: encryptSecret("Bearer test-rc-webhook-token") })
      .where(eq(stripeAccounts.id, connected.accountId));

    const payload = JSON.stringify({
      api_version: "1.0",
      event: {
        id: "rc_evt_live_1",
        type: "INITIAL_PURCHASE",
        environment: "PRODUCTION",
        event_timestamp_ms: new Date("2026-11-25T11:30:00.000Z").getTime(),
        purchased_at_ms: new Date("2026-11-25T11:30:00.000Z").getTime(),
        expiration_at_ms: new Date("2026-12-25T11:30:00.000Z").getTime(),
        app_user_id: "user_42",
        original_app_user_id: "user_42",
        product_id: "com.acme.pro_monthly",
        period_type: "NORMAL",
        transaction_id: "txn_live_1",
        original_transaction_id: "txn_live_1",
        currency: "USD",
        price: 15,
        price_in_purchased_currency: 15,
        country_code: "FR",
        subscriber_attributes: {
          $displayName: { value: "Marie Curie" },
        },
      },
    });

    const outcome = await receiveRevenueCatWebhook(
      connected.accountId,
      payload,
      { signature: null, authorization: "Bearer test-rc-webhook-token" },
      { now: NOW },
    );
    expect(outcome).toEqual({ status: "accepted", notify: true, sync: true });

    const createdScreen = await createScreen(workspaceId, { name: "Wall", timeZone: "UTC" });
    expect(createdScreen.ok).toBe(true);
    if (!createdScreen.ok) return;

    const [{ publicToken }] = await db().query.screens.findMany({
      columns: { publicToken: true },
    });
    const state = await getDisplayStateByToken(publicToken, { now: NOW });
    expect(state).not.toBeNull();
    if (!state) return;

    expect(state.status).toBe("ready");
    // Overview $500 MRR + live $15 MRR webhook after overviewUpdatedAt = $515 MRR.
    expect(state.metrics.mrr).toBe(51500);
    expect(state.metrics.activeCustomers).toBe(25);
    expect(state.metrics.trialingSubscriptions).toBe(4);
    // Today revenue: $80 from chart + $15 live webhook = $95; yesterday $120.
    expect(state.metrics.revenue.today).toBe(9500);
    expect(state.metrics.revenue.yesterday).toBe(12000);
    expect(state.metrics.thisMonth.newCustomers).toBe(3);
    expect(state.metrics.customersCreatedToday).toBe(11);
    expect(
      state.feed.some(
        (item) => item.kind === "new" && item.live && item.planName === "Pro Monthly",
      ),
    ).toBe(true);
  });
});
