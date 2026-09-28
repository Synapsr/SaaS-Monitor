import { eq } from "drizzle-orm";
import { after } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { exchangeRates, mrrMovements, payments, stripeAccounts, subscriptions } from "@/db/schema";
import { decryptSecret } from "@/server/crypto";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { FakeStripe } from "@/test/fake-stripe";
import { createStripeAccount, getStripeAccount } from "@/test/stripe-accounts";
import {
  connectStripeAccount,
  disconnectStripeAccount,
  enableInstantUpdates,
  listStripeAccountSummaries,
  reimportStripeAccount,
  renameStripeAccount,
  setWebhookSigningSecret,
  webhookSetupInstructions,
} from "./accounts";
import { StripeAccessError } from "./errors";
import { SYNC_EVENT_TYPES } from "./event-types";
import { secretKeySchema } from "./keys";

vi.mock("next/server", () => ({ after: vi.fn() }));
// Stripe only delivers webhooks to public HTTPS addresses.
vi.stubEnv("APP_URL", "https://monitor.example.com");

const TEST_KEY = "rk_test_51AbCdEfGhIjKlMnOp4f2a";
const NOT_FOUND = { ok: false, error: "This Stripe account no longer exists." };
const LIVE_KEY = "rk_live_51AbCdEfGhIjKlMnOp9z9z";

describe("Stripe accounts", () => {
  let stripe: FakeStripe;
  let workspaceId: string;
  const options = { createGateway: () => stripe };
  const connect = (secretKey = TEST_KEY, name = "Acme") =>
    connectStripeAccount(
      { workspaceId, name, secretKey: secretKeySchema.parse(secretKey) },
      options,
    );

  beforeEach(async () => {
    vi.mocked(after).mockClear();
    await resetDatabase();
    ({ workspaceId } = await createUserWithWorkspace());
    stripe = new FakeStripe();
  });

  describe("connecting", () => {
    it("stores the key encrypted, registers a webhook and starts the import", async () => {
      const result = await connect();

      expect(result).toEqual({ ok: true, accountId: expect.any(String) });
      if (!result.ok) return;
      const account = await getStripeAccount(result.accountId);
      expect(account).toMatchObject({
        workspaceId,
        name: "Acme",
        stripeAccountId: "acct_fake",
        livemode: false,
        secretKeyHint: "rk_test_…4f2a",
        defaultCurrency: "usd",
        status: "importing",
        backfill: { phase: "subscriptions", cursor: null },
      });
      expect(decryptSecret(account.encryptedSecretKey)).toBe(TEST_KEY);
      expect(account.eventsCursor).toBeGreaterThan(Date.now() / 1000 - 60);

      const [endpoint] = stripe.webhookEndpoints.values();
      expect(endpoint).toEqual({
        url: `https://monitor.example.com/api/webhooks/stripe/${result.accountId}`,
        events: SYNC_EVENT_TYPES,
      });
      expect(account.webhookEndpointId).toBe([...stripe.webhookEndpoints.keys()][0]);
      expect(decryptSecret(account.encryptedWebhookSecret!)).toMatch(/^whsec_/);
      expect(after).toHaveBeenCalledTimes(1);
    });

    it("explains an invalid key", async () => {
      stripe.failure = new StripeAccessError("authentication", "Invalid API Key provided");

      expect(await connect()).toEqual({
        ok: false,
        error:
          "This key is not valid. Copy it again from the API keys page of the Stripe Dashboard.",
      });
    });

    it("says which permissions the key is missing", async () => {
      stripe.deniedResources.add("coupons");
      stripe.deniedResources.add("events");

      expect(await connect()).toEqual({
        ok: false,
        error: "This key is missing 2 permissions.",
        missingPermissions: ["rak_event_read", "rak_coupon_read"],
      });
      expect(await db().$count(stripeAccounts)).toBe(0);
    });

    it("still connects when the account details cannot be read", async () => {
      stripe.deniedResources.add("account");

      const result = await connect();
      if (!result.ok) throw new Error(result.error);

      expect(await getStripeAccount(result.accountId)).toMatchObject({
        stripeAccountId: "acct_fake",
        name: "Acme",
        defaultCurrency: null,
      });
    });

    it("falls back to polling when Stripe refuses to create the webhook", async () => {
      stripe.deniedResources.add("webhook_endpoints");

      const result = await connect();
      if (!result.ok) throw new Error(result.error);

      expect(await getStripeAccount(result.accountId)).toMatchObject({
        webhookEndpointId: null,
        encryptedWebhookSecret: null,
      });
    });

    it("refuses the same account twice, but accepts its other mode", async () => {
      expect(await connect()).toMatchObject({ ok: true });

      expect(await connect()).toEqual({
        ok: false,
        error: "This Stripe account is already connected.",
      });
      expect(await connect(LIVE_KEY)).toMatchObject({ ok: true });
    });

    it("replaces the key of a failing account and keeps its data", async () => {
      const first = await connect();
      if (!first.ok) throw new Error(first.error);
      await db()
        .update(stripeAccounts)
        .set({ status: "error", lastError: "Revoked.", backfill: null })
        .where(eq(stripeAccounts.id, first.accountId));

      const second = await connect("rk_test_51NewKeyNewKeyNewKey1234");

      expect(second).toEqual({ ok: true, accountId: first.accountId });
      const account = await getStripeAccount(first.accountId);
      expect(account).toMatchObject({
        status: "ready",
        lastError: null,
        secretKeyHint: "rk_test_…1234",
      });
      expect(decryptSecret(account.encryptedSecretKey)).toBe("rk_test_51NewKeyNewKeyNewKey1234");
    });
  });

  describe("summaries", () => {
    it("shows the import progress, then the MRR and how updates arrive", async () => {
      const importing = await createStripeAccount(workspaceId, { name: "New" });
      const ready = await createStripeAccount(workspaceId, {
        name: "Live",
        livemode: true,
        status: "ready",
        backfill: null,
        lastSyncedAt: new Date(),
        encryptedWebhookSecret: "v1.secret",
        lastWebhookAt: new Date("2026-03-15T10:00:00Z"),
      });
      await db()
        .update(stripeAccounts)
        .set({ backfill: { ...importing.backfill!, subscriptions: 120, payments: 40 } })
        .where(eq(stripeAccounts.id, importing.id));
      for (const [id, currency, mrr] of [
        ["sub_1", "usd", 5000],
        ["sub_2", "eur", 1000],
      ] as const) {
        await db().insert(subscriptions).values({
          accountId: ready.id,
          stripeSubscriptionId: id,
          stripeCustomerId: "cus_1",
          status: "active",
          currency,
          mrr,
          startedAt: new Date(),
        });
      }
      // Fresh rates, so that the test never reaches the network: 1 USD = 0.8 EUR.
      await db()
        .insert(exchangeRates)
        .values({ base: "usd", rates: { eur: 0.8 }, fetchedAt: new Date() });

      const summaries = await listStripeAccountSummaries(workspaceId);

      expect(summaries).toEqual([
        {
          id: importing.id,
          name: "New",
          livemode: false,
          keyHint: "rk_test_…4f2a",
          status: "importing",
          lastError: null,
          lastSyncedAt: null,
          updates: { mode: "polling", intervalSeconds: 1037 },
          importProgress: { subscriptions: 120, payments: 40 },
          mrr: null,
        },
        expect.objectContaining({
          id: ready.id,
          status: "ready",
          updates: { mode: "webhook", lastEventAt: new Date("2026-03-15T10:00:00Z") },
          importProgress: null,
          mrr: { amount: 5000 + 1250, currency: "usd" },
        }),
      ]);
    });

    it("only lists the accounts of the workspace", async () => {
      await createStripeAccount(workspaceId);
      const other = await createUserWithWorkspace("Grace Hopper");

      expect(await listStripeAccountSummaries(other.workspaceId)).toEqual([]);
    });
  });

  describe("managing", () => {
    it("only renames accounts of the workspace", async () => {
      const account = await createStripeAccount(workspaceId);
      const other = await createUserWithWorkspace("Grace Hopper");

      expect(await renameStripeAccount(other.workspaceId, account.id, "Stolen")).toEqual(NOT_FOUND);
      expect((await getStripeAccount(account.id)).name).toBe("Acme");
      expect(await renameStripeAccount(workspaceId, account.id, "Acme EU")).toEqual({ ok: true });
      expect((await getStripeAccount(account.id)).name).toBe("Acme EU");
    });

    it("disconnects: deletes the app's webhook endpoint and every imported row", async () => {
      const result = await connect();
      if (!result.ok) throw new Error(result.error);
      const other = await createUserWithWorkspace("Grace Hopper");

      expect(await disconnectStripeAccount(other.workspaceId, result.accountId, options)).toEqual(
        NOT_FOUND,
      );
      expect(await getStripeAccount(result.accountId)).toBeDefined();

      expect(await disconnectStripeAccount(workspaceId, result.accountId, options)).toEqual({
        ok: true,
      });
      expect(await getStripeAccount(result.accountId)).toBeUndefined();
      expect(stripe.webhookEndpoints.size).toBe(0);
    });

    it("disconnects even when Stripe no longer accepts the key", async () => {
      const result = await connect();
      if (!result.ok) throw new Error(result.error);
      stripe.failure = new StripeAccessError("authentication", "Invalid API Key provided");
      vi.spyOn(console, "warn").mockImplementation(() => {});

      await disconnectStripeAccount(workspaceId, result.accountId, options);

      expect(await getStripeAccount(result.accountId)).toBeUndefined();
    });

    it("reimports from scratch", async () => {
      const account = await createStripeAccount(workspaceId, { status: "ready", backfill: null });
      await db().insert(payments).values({
        accountId: account.id,
        stripeChargeId: "ch_1",
        amount: 100,
        currency: "usd",
        occurredAt: new Date(),
        origin: "live",
      });
      await db().insert(mrrMovements).values({
        accountId: account.id,
        stripeSubscriptionId: "sub_1",
        stripeCustomerId: "cus_1",
        kind: "new",
        amount: 100,
        currency: "usd",
        occurredAt: new Date(),
        origin: "live",
      });

      const other = await createUserWithWorkspace("Grace Hopper");
      expect(await reimportStripeAccount(other.workspaceId, account.id)).toEqual(NOT_FOUND);
      expect(await db().$count(payments)).toBe(1);
      expect(after).not.toHaveBeenCalled();

      expect(await reimportStripeAccount(workspaceId, account.id)).toEqual({ ok: true });

      expect(await getStripeAccount(account.id)).toMatchObject({
        status: "importing",
        backfill: { phase: "subscriptions", subscriptions: 0 },
        lastSyncedAt: null,
      });
      expect(await db().$count(payments)).toBe(0);
      expect(await db().$count(mrrMovements)).toBe(0);
      expect(after).toHaveBeenCalledTimes(1);
    });

    it("enables instant updates when possible, and explains why not otherwise", async () => {
      stripe.deniedResources.add("webhook_endpoints");
      const result = await connect();
      if (!result.ok) throw new Error(result.error);

      expect(await enableInstantUpdates(workspaceId, result.accountId, options)).toEqual({
        ok: false,
        error:
          "Stripe refused to create the webhook. Give the key the “Webhook Endpoints (Write)” permission, or add the endpoint manually.",
      });
      stripe.deniedResources.delete("webhook_endpoints");
      expect(await enableInstantUpdates(workspaceId, result.accountId, options)).toEqual({
        ok: true,
      });
      expect(stripe.webhookEndpoints.size).toBe(1);
      const other = await createUserWithWorkspace("Grace Hopper");
      expect(await enableInstantUpdates(other.workspaceId, result.accountId, options)).toEqual(
        NOT_FOUND,
      );
    });

    it("stores the signing secret of an endpoint added by hand", async () => {
      const account = await createStripeAccount(workspaceId);

      expect(
        await setWebhookSigningSecret(workspaceId, account.id, "whsec_0123456789abcdefghijKLMN"),
      ).toEqual({ ok: true });
      const stored = (await getStripeAccount(account.id)).encryptedWebhookSecret;
      expect(decryptSecret(stored!)).toBe("whsec_0123456789abcdefghijKLMN");

      const other = await createUserWithWorkspace("Grace Hopper");
      expect(
        await setWebhookSigningSecret(
          other.workspaceId,
          account.id,
          "whsec_someoneelse0123456789ab",
        ),
      ).toEqual(NOT_FOUND);
      expect((await getStripeAccount(account.id)).encryptedWebhookSecret).toBe(stored);
    });

    it("explains how to add the webhook by hand", () => {
      expect(webhookSetupInstructions("0b6e4ffd-2f5b-4c1e-9a53-1b0d5b8c6c11")).toEqual({
        url: "https://monitor.example.com/api/webhooks/stripe/0b6e4ffd-2f5b-4c1e-9a53-1b0d5b8c6c11",
        events: [...SYNC_EVENT_TYPES],
      });
    });
  });
});
