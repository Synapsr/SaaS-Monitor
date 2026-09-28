import { describe, expect, it } from "vitest";
import { POLL_INTERVAL_MS, retryDelay } from "@/lib/display/backoff";

describe("retry delay", () => {
  it("doubles after each failure, with jitter in the upper half", () => {
    expect(retryDelay(1, () => 0)).toBe(POLL_INTERVAL_MS / 2);
    expect(retryDelay(1, () => 1)).toBe(POLL_INTERVAL_MS);
    expect(retryDelay(2, () => 1)).toBe(2 * POLL_INTERVAL_MS);
    expect(retryDelay(3, () => 1)).toBe(4 * POLL_INTERVAL_MS);
  });

  it("never waits more than five minutes", () => {
    expect(retryDelay(50, () => 1)).toBe(300_000);
  });
});
