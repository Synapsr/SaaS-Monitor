import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { mrrMovements, stripeAccounts } from "@/db/schema";
import { StripeAccessError } from "@/server/stripe/errors";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { FakeStripe } from "@/test/fake-stripe";
import { stripeSubscription } from "@/test/stripe-fixtures";
import { createStripeAccount, getStripeAccount } from "@/test/stripe-accounts";
import { acquireSyncLease } from "./lease";
import { syncAccount } from "./run";

const NOW = new Date("2026-03-15T12:00:00Z");
const MINUTE_MS = 60_000;
const later = (minutes: number) => new Date(NOW.getTime() + minutes * MINUTE_MS);

describe("syncing an account", () => {
  let stripe: FakeStripe;
  let workspaceId: string;
  let accountId: string;

  const syncAt = (now: Date) =>
    syncAccount(accountId, { createGateway: () => stripe, now: () => now });

  beforeEach(async () => {
    await resetDatabase();
    ({ workspaceId } = await createUserWithWorkspace());
    accountId = (await createStripeAccount(workspaceId, { now: NOW })).id;
    stripe = new FakeStripe();
    stripe.putSubscription(stripeSubscription());
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  describe("lease", () => {
    it("lets a single sync run at a time", async () => {
      const reports = await Promise.all([syncAt(NOW), syncAt(NOW), syncAt(NOW)]);

      expect(reports.filter((report) => report !== null)).toHaveLength(1);
      expect(await db().$count(mrrMovements)).toBe(1);
    });

    it("waits for a held lease to expire", async () => {
      expect(await acquireSyncLease(accountId, NOW)).not.toBeNull();

      expect(await syncAt(later(1))).toBeNull();
      expect(await syncAt(later(4))).toMatchObject({ ok: true });
    });

    it("releases the lease when done", async () => {
      await syncAt(NOW);

      expect((await getStripeAccount(accountId)).syncLockedUntil).toBeNull();
    });
  });

  describe("errors", () => {
    it("asks for a new key when Stripe rejects it", async () => {
      stripe.failure = new StripeAccessError(
        "authentication",
        "Invalid API Key provided: rk_test_****4f2a",
      );

      expect(await syncAt(NOW)).toMatchObject({ ok: false });
      expect(await getStripeAccount(accountId)).toMatchObject({
        status: "error",
        lastError:
          "This Stripe key was revoked or rolled. Connect the account again with a new key.",
        syncFailures: 1,
        // Checked again later: nothing to gain from retrying sooner.
        syncLockedUntil: later(30),
      });
    });

    it("names the missing permission", async () => {
      stripe.deniedResources.add("coupons");
      stripe.putSubscription(
        stripeSubscription({
          discounts: [{ id: "di_1", end: null, source: { coupon: "coupon_1" } }],
        }),
      );

      await syncAt(NOW);

      expect((await getStripeAccount(accountId)).lastError).toBe(
        "This Stripe key is missing the “Coupons (Read)” permission. Edit the key in the Stripe Dashboard to add it.",
      );
    });

    it("retries rate limits and outages later, backing off", async () => {
      await syncAt(NOW);
      stripe.failure = new StripeAccessError("rate_limited", "Too many requests");

      await syncAt(later(20));
      expect(await getStripeAccount(accountId)).toMatchObject({
        status: "ready",
        lastError: null,
        syncFailures: 1,
        syncLockedUntil: later(21),
      });
      expect(await syncAt(later(20.5))).toBeNull();
      await syncAt(later(22));
      expect((await getStripeAccount(accountId)).syncLockedUntil).toEqual(later(24));
    });

    it("recovers as soon as Stripe accepts the key again", async () => {
      stripe.failure = new StripeAccessError("authentication", "Invalid API Key provided");
      await syncAt(NOW);
      stripe.failure = null;

      expect(await syncAt(later(31))).toMatchObject({ ok: true, mode: "import" });
      expect(await getStripeAccount(accountId)).toMatchObject({
        status: "ready",
        lastError: null,
        syncFailures: 0,
      });
    });

    it("keeps importing after an interrupted import", async () => {
      stripe.pageSize = 1;
      stripe.putSubscription(stripeSubscription());
      await syncAccount(accountId, {
        createGateway: () => stripe,
        now: () => NOW,
        scanBudgetMs: 0,
      });
      stripe.failure = new StripeAccessError("permission", "Missing permission");
      await syncAt(later(1));
      stripe.failure = null;

      await syncAccount(accountId, {
        createGateway: () => stripe,
        now: () => later(32),
        scanBudgetMs: 0,
      });

      expect(await getStripeAccount(accountId)).toMatchObject({
        status: "importing",
        lastError: null,
      });
    });

    it("explains a key that can no longer be decrypted", async () => {
      await db()
        .update(stripeAccounts)
        .set({ encryptedSecretKey: "v1.bm90.YQ.Yg" })
        .where(eq(stripeAccounts.id, accountId));

      await syncAt(NOW);

      expect(await getStripeAccount(accountId)).toMatchObject({
        status: "error",
        lastError: expect.stringContaining("ENCRYPTION_KEY"),
      });
    });
  });
});
