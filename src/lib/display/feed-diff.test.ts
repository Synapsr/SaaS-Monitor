import { describe, expect, it } from "vitest";
import { diffFeed } from "@/lib/display/feed-diff";
import { feedItem } from "@/lib/display/testing";

describe("feed diffing", () => {
  it("never finds anything fresh on the first load, even live items", () => {
    const feed = [feedItem({ live: true }), feedItem({ live: false })];
    const { fresh, seen } = diffFeed(null, feed);
    expect(fresh).toEqual([]);
    expect([...seen]).toEqual(feed.map((item) => item.id));
  });

  it("finds live items that appeared since the last poll, oldest first", () => {
    const known = feedItem({ occurredAt: "2026-09-28T10:00:00Z" });
    const { seen } = diffFeed(null, [known]);
    const newer = feedItem({ occurredAt: "2026-09-28T12:01:00Z" });
    const older = feedItem({ occurredAt: "2026-09-28T12:00:00Z" });

    const { fresh } = diffFeed(seen, [newer, older, known]);
    expect(fresh).toEqual([older, newer]);
  });

  it("ignores new items imported from history", () => {
    const { seen } = diffFeed(null, []);
    const imported = feedItem({ live: false });
    const next = diffFeed(seen, [imported]);
    expect(next.fresh).toEqual([]);
    expect(next.seen.has(imported.id)).toBe(true);
  });

  it("reports every missed live item after a reconnection", () => {
    const { seen } = diffFeed(null, [feedItem()]);
    const missed = Array.from({ length: 6 }, () => feedItem());
    expect(diffFeed(seen, missed).fresh).toHaveLength(6);
  });

  it("does not replay an item that left the feed and came back", () => {
    const item = feedItem();
    const first = diffFeed(null, [item]);
    const without = diffFeed(first.seen, []);
    expect(diffFeed(without.seen, [item]).fresh).toEqual([]);
  });

  it("forgets the oldest ids after a few hundred, keeping the current feed", () => {
    let seen = diffFeed(null, []).seen;
    for (let index = 0; index < 60; index += 1) {
      seen = diffFeed(
        seen,
        Array.from({ length: 10 }, () => feedItem()),
      ).seen;
    }
    const current = [feedItem()];
    seen = diffFeed(seen, current).seen;
    expect(seen.size).toBe(500);
    expect(seen.has(current[0].id)).toBe(true);
  });
});
