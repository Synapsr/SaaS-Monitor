import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MomentQueue } from "@/lib/display/moment-queue";
import type { Moment } from "@/lib/display/moments";

const test = (id: string): Moment => ({ id, kind: "test" });
const milestone = (id: string): Moment => ({
  id,
  kind: "milestone",
  amount: 1,
  metric: "mrr",
  isGoal: false,
});

describe("moment queue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("plays moments one at a time with a pause in between", () => {
    const queue = new MomentQueue(() => 1_000);
    queue.subscribe(() => {});
    queue.enqueue([test("a"), test("b")]);
    expect(queue.getCurrent()?.id).toBe("a");

    vi.advanceTimersByTime(1_000);
    expect(queue.getCurrent()).toBeNull();
    expect(queue.isIdle()).toBe(false);

    vi.advanceTimersByTime(700);
    expect(queue.getCurrent()?.id).toBe("b");
    vi.advanceTimersByTime(1_000);
    expect(queue.isIdle()).toBe(true);
  });

  it("notifies subscribers of every change", () => {
    const queue = new MomentQueue(() => 1_000);
    const listener = vi.fn();
    queue.subscribe(listener);
    queue.enqueue([test("a")]);
    vi.advanceTimersByTime(1_000);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("waits for a subscriber and stops its timers without one", () => {
    const queue = new MomentQueue(() => 1_000);
    queue.enqueue([test("a")]);
    expect(queue.getCurrent()).toBeNull();

    const unsubscribe = queue.subscribe(() => {});
    expect(queue.getCurrent()?.id).toBe("a");
    unsubscribe();
    vi.advanceTimersByTime(5_000);
    expect(queue.getCurrent()?.id).toBe("a");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("drops the oldest moments when too many wait, but never a milestone", () => {
    const queue = new MomentQueue(() => 1_000);
    queue.subscribe(() => {});
    queue.enqueue([test("playing")]);
    queue.enqueue([milestone("m"), ...["1", "2", "3", "4", "5", "6"].map(test)]);

    const played: string[] = [];
    for (let step = 0; step < 16; step += 1) {
      const current = queue.getCurrent();
      if (current && played.at(-1) !== current.id) played.push(current.id);
      vi.advanceTimersByTime(850);
    }
    expect(played).toEqual(["playing", "m", "2", "3", "4", "5", "6"]);
  });
});
