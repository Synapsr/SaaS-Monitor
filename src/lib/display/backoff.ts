/** How often a screen asks for fresh data while everything is fine. */
export const POLL_INTERVAL_MS = 10_000;

const MAX_RETRY_DELAY_MS = 5 * 60_000;

/**
 * Delay before the next attempt after `failures` consecutive failures: doubling from the poll
 * interval up to five minutes, with jitter so that every screen of an office does not hit a
 * recovering server at the same instant.
 */
export function retryDelay(failures: number, random: () => number = Math.random): number {
  const ceiling = Math.min(MAX_RETRY_DELAY_MS, POLL_INTERVAL_MS * 2 ** Math.max(0, failures - 1));
  return Math.round(ceiling / 2 + (random() * ceiling) / 2);
}
