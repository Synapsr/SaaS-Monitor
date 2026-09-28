/**
 * Seeded pseudo-random numbers (mulberry32). The demo must render the same data on the server and
 * during hydration, so it never uses `Math.random()`.
 */
export interface Random {
  /** A number in [0, 1). */
  (): number;
  /** Internal state, to resume the same sequence later (e.g. from another render). */
  readonly state: number;
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  return Object.defineProperty(next, "state", { get: () => state }) as Random;
}

export function randomBetween(random: Random, min: number, max: number): number {
  return min + random() * (max - min);
}

export function randomInt(random: Random, min: number, max: number): number {
  return Math.floor(randomBetween(random, min, max + 1));
}

export function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

/** Picks an item with a probability proportional to its weight. */
export function pickWeighted<T>(random: Random, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let threshold = random() * total;
  for (const [item, weight] of items) {
    threshold -= weight;
    if (threshold < 0) return item;
  }
  return items[items.length - 1][0];
}

/** Number of events in an interval where `mean` of them are expected (Knuth's algorithm). */
export function poisson(random: Random, mean: number): number {
  if (mean <= 0) return 0;
  const limit = Math.exp(-mean);
  let count = 0;
  let product = random();
  while (product > limit) {
    count += 1;
    product *= random();
  }
  return count;
}
