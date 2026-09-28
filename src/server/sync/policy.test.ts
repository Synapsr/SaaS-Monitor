import { describe, expect, it } from "vitest";
import {
  isReconcileDue,
  isSyncDue,
  isWebhookHealthy,
  pollIntervalSeconds,
  retryDelaySeconds,
  updatesMode,
  type SyncState,
} from "./policy";

const NOW = new Date("2026-03-15T12:00:00Z");
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

function state(overrides: Partial<SyncState> = {}): SyncState {
  return {
    status: "ready",
    lastSyncedAt: minutesAgo(1),
    syncRequestedAt: null,
    syncLockedUntil: null,
    hasWebhookSecret: false,
    lastWebhookAt: null,
    lastEventAt: null,
    paymentsLast30Days: 0,
    ...overrides,
  };
}

describe("polling interval", () => {
  it("spends a quarter of Stripe's minimum read allowance on quiet accounts", () => {
    // 10,000 reads a month, a quarter of them for polling: every 1,037 seconds.
    expect(pollIntervalSeconds(0)).toBe(1037);
    expect(pollIntervalSeconds(20)).toBe(1037);
  });

  it("polls faster as sales grow the allowance", () => {
    expect(pollIntervalSeconds(100)).toBe(208);
    expect(pollIntervalSeconds(500)).toBe(60);
  });

  it("never polls more than once a minute", () => {
    expect(pollIntervalSeconds(100_000)).toBe(60);
  });
});

describe("webhook health", () => {
  it("trusts a webhook until an event arrives without it", () => {
    expect(isWebhookHealthy(state({ hasWebhookSecret: true }))).toBe(true);
    expect(
      isWebhookHealthy(
        state({
          hasWebhookSecret: true,
          lastWebhookAt: minutesAgo(10),
          lastEventAt: minutesAgo(10),
        }),
      ),
    ).toBe(true);
    expect(
      isWebhookHealthy(
        state({
          hasWebhookSecret: true,
          lastWebhookAt: minutesAgo(60),
          lastEventAt: minutesAgo(10),
        }),
      ),
    ).toBe(false);
  });

  it("tolerates webhooks delivered shortly after the sync saw their event", () => {
    expect(
      isWebhookHealthy(
        state({
          hasWebhookSecret: true,
          lastWebhookAt: minutesAgo(12),
          lastEventAt: minutesAgo(10),
        }),
      ),
    ).toBe(true);
  });

  it("describes how updates arrive", () => {
    const lastWebhookAt = minutesAgo(3);
    expect(updatesMode(state({ hasWebhookSecret: true, lastWebhookAt }))).toEqual({
      mode: "webhook",
      lastEventAt: lastWebhookAt,
    });
    expect(updatesMode(state({ paymentsLast30Days: 100 }))).toEqual({
      mode: "polling",
      intervalSeconds: 208,
    });
  });
});

describe("sync due", () => {
  it("always continues an import", () => {
    expect(isSyncDue(state({ status: "importing" }), NOW)).toBe(true);
    expect(isSyncDue(state({ lastSyncedAt: null }), NOW)).toBe(true);
  });

  it("follows the polling interval without webhook", () => {
    expect(isSyncDue(state({ lastSyncedAt: minutesAgo(10) }), NOW)).toBe(false);
    expect(isSyncDue(state({ lastSyncedAt: minutesAgo(18) }), NOW)).toBe(true);
  });

  it("syncs when a webhook asks, and only checks now and then otherwise", () => {
    const webhook = { hasWebhookSecret: true, lastSyncedAt: minutesAgo(20) };
    expect(isSyncDue(state(webhook), NOW)).toBe(false);
    expect(isSyncDue(state({ ...webhook, syncRequestedAt: minutesAgo(0) }), NOW)).toBe(true);
    expect(isSyncDue(state({ ...webhook, lastSyncedAt: minutesAgo(31) }), NOW)).toBe(true);
  });

  it("waits while another sync runs or after a failure", () => {
    const locked = { lastSyncedAt: null, syncLockedUntil: new Date(NOW.getTime() + 1000) };
    expect(isSyncDue(state({ ...locked, status: "importing" }), NOW)).toBe(false);
  });

  it("retries failing accounts at the safety-net pace", () => {
    expect(isSyncDue(state({ status: "error", lastSyncedAt: minutesAgo(20) }), NOW)).toBe(false);
    expect(isSyncDue(state({ status: "error", lastSyncedAt: minutesAgo(30) }), NOW)).toBe(true);
  });
});

describe("reconcile due", () => {
  it("runs once a day", () => {
    expect(isReconcileDue(null, NOW)).toBe(true);
    expect(isReconcileDue(minutesAgo(23 * 60), NOW)).toBe(false);
    expect(isReconcileDue(minutesAgo(24 * 60), NOW)).toBe(true);
  });
});

describe("retry delay", () => {
  it("doubles after each failure, up to 30 minutes", () => {
    expect([1, 2, 3, 4, 5, 6, 10].map(retryDelaySeconds)).toEqual([
      60, 120, 240, 480, 960, 1800, 1800,
    ]);
  });
});
