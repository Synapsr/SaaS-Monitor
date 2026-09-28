import type { FeedItem } from "@/lib/display/types";

/** Enough to recognize every item a feed can show, without growing for weeks on a kiosk. */
const MEMORY_SIZE = 500;

export interface FeedDiff {
  /** Live items that just appeared, oldest first: the ones worth a sound and a celebration. */
  fresh: FeedItem[];
  /** Ids to remember for the next diff. */
  seen: Set<string>;
}

/**
 * Finds the feed items a display has not shown yet. On the first load (`seen` is `null`) nothing
 * is fresh: history is never replayed, even when it was detected live a minute ago. Items
 * imported from history (`live: false`) are remembered but never fresh.
 */
export function diffFeed(seen: ReadonlySet<string> | null, feed: readonly FeedItem[]): FeedDiff {
  const fresh =
    seen === null
      ? []
      : feed
          .filter((item) => item.live && !seen.has(item.id))
          .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));

  // Sets iterate in insertion order: re-adding current ids keeps them, the oldest ones drop.
  const remembered = new Set(seen);
  for (const item of feed) {
    remembered.delete(item.id);
    remembered.add(item.id);
  }
  const overflow = remembered.size - MEMORY_SIZE;
  if (overflow > 0) {
    let dropped = 0;
    for (const id of remembered) {
      if (dropped++ === overflow) break;
      remembered.delete(id);
    }
  }
  return { fresh, seen: remembered };
}
