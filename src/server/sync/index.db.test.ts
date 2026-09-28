import { after } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { FakeStripe } from "@/test/fake-stripe";
import { createStripeAccount } from "@/test/stripe-accounts";
import { scheduleSync, syncDueAccounts } from ".";

vi.mock("next/server", () => ({ after: vi.fn() }));

const NOW = new Date("2026-03-15T12:00:00Z");
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

describe("scheduling syncs", () => {
  let workspaceId: string;
  const options = { createGateway: () => new FakeStripe(), now: () => NOW };

  beforeEach(async () => {
    vi.mocked(after).mockClear();
    vi.spyOn(console, "info").mockImplementation(() => {});
    await resetDatabase();
    ({ workspaceId } = await createUserWithWorkspace());
  });

  const readyAccount = (overrides: Parameters<typeof createStripeAccount>[1] = {}) =>
    createStripeAccount(workspaceId, {
      status: "ready",
      backfill: null,
      lastReconciledAt: NOW,
      eventsCursor: NOW.getTime() / 1000,
      ...overrides,
    });

  it("syncs the accounts that are due, and only those", async () => {
    const importing = await createStripeAccount(workspaceId, { now: NOW });
    const polledLongAgo = await readyAccount({ lastSyncedAt: minutesAgo(30) });
    const polledRecently = await readyAccount({ lastSyncedAt: minutesAgo(2) });
    const announced = await readyAccount({
      lastSyncedAt: minutesAgo(2),
      syncRequestedAt: minutesAgo(1),
      encryptedWebhookSecret: "v1.secret",
    });
    const backingOff = await readyAccount({
      lastSyncedAt: minutesAgo(30),
      syncLockedUntil: new Date(NOW.getTime() + 60_000),
    });

    const reports = await syncDueAccounts(
      [importing, polledLongAgo, polledRecently, announced, backingOff].map(
        (account) => account.id,
      ),
      options,
    );

    expect(reports.map((report) => report.accountId).sort()).toEqual(
      [importing.id, polledLongAgo.id, announced.id].sort(),
    );
  });

  it("defers the work until after the response", async () => {
    // The deferred task runs with the real clock and gateway: the account must not be due.
    const justNow = new Date();
    const account = await readyAccount({ lastSyncedAt: justNow, lastReconciledAt: justNow });

    scheduleSync([]);
    expect(after).not.toHaveBeenCalled();
    scheduleSync([account.id, account.id]);
    expect(after).toHaveBeenCalledTimes(1);

    const task = vi.mocked(after).mock.calls[0][0] as () => Promise<unknown>;
    await expect(task()).resolves.toEqual([]);
  });
});
