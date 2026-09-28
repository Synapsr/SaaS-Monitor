/** Same bound as `screenSettingsSchema.goal`. */
const MAX_GOAL = 1_000_000_000;

const SUFFIXES: Record<string, number> = { k: 1_000, m: 1_000_000 };

/**
 * Reads an MRR target typed by hand: "12500", "12,500" or "12.5k" → 12500, because founders
 * think in "10k MRR". `null` when it isn't a whole, positive amount.
 */
export function parseGoal(input: string): number | null {
  const match = /^(\d+(?:\.\d+)?)([km])?$/i.exec(input.replace(/[\s,_']/g, ""));
  if (!match) return null;
  const [, amount, suffix] = match;
  const goal = Number(amount) * (suffix ? SUFFIXES[suffix.toLowerCase()] : 1);
  return Number.isInteger(goal) && goal >= 1 && goal <= MAX_GOAL ? goal : null;
}
