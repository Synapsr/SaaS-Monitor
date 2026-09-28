import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClock } from "./use-now";

const NOON = Date.parse("2026-09-28T12:00:00Z");

describe("clock", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOON });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("tells the time to a component rendering before any subscribes", () => {
    const clock = createClock(60_000);

    expect(clock.getSnapshot()).toBe(NOON);
    vi.advanceTimersByTime(1_000);
    // Consecutive reads agree, or React would render again and again.
    expect(clock.getSnapshot()).toBe(NOON);
  });

  it("ticks every interval while components listen", () => {
    const clock = createClock(60_000);
    const listener = vi.fn();
    const unsubscribe = clock.subscribe(listener);

    vi.advanceTimersByTime(59_000);
    expect(clock.getSnapshot()).toBe(NOON);
    vi.advanceTimersByTime(1_000);
    expect(listener).toHaveBeenCalledOnce();
    expect(clock.getSnapshot()).toBe(NOON + 60_000);
    unsubscribe();
  });

  it("tells the current time again when components come back later", () => {
    const clock = createClock(60_000);
    clock.subscribe(() => {})();

    vi.advanceTimersByTime(3_600_000);

    expect(clock.getSnapshot()).toBe(NOON + 3_600_000);
  });
});
