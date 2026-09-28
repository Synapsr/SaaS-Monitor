import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { exchangeRates } from "@/db/schema";
import { env } from "@/env";
import { convertAmount } from "@/lib/money";

/**
 * Fetches exchange rates for `base`: how many units of each currency one unit of `base` buys,
 * keyed by lowercase ISO code. Injectable so tests never reach the network.
 */
export type RateSource = (base: string) => Promise<Record<string, number>>;

export interface ExchangeRateOptions {
  source?: RateSource;
  now?: Date;
}

const MAX_AGE_MS = 12 * 60 * 60 * 1000;
/** After a failure, rates are not fetched again for a while: displays poll every few seconds. */
const RETRY_AFTER_MS = 5 * 60 * 1000;

const frankfurterResponse = z.object({ rates: z.record(z.string(), z.number().positive()) });

/** Daily reference rates of the European Central Bank, via Frankfurter (free, no API key). */
export const frankfurterRates: RateSource = async (base) => {
  const url = `${env().FX_RATES_URL}/latest?base=${encodeURIComponent(base.toUpperCase())}`;
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`Frankfurter answered ${response.status} for ${url}`);
  const { rates } = frankfurterResponse.parse(await response.json());
  return Object.fromEntries(
    Object.entries(rates).map(([currency, rate]) => [currency.toLowerCase(), rate]),
  );
};

/** Last failure per source and base currency. */
const failures = new WeakMap<RateSource, Map<string, number>>();

/**
 * Rates for `base`, cached for 12 hours in the database. When they cannot be refreshed, stale
 * rates are better than none; `null` means no rate was ever fetched.
 */
export async function getExchangeRates(
  base: string,
  { source = frankfurterRates, now = new Date() }: ExchangeRateOptions = {},
): Promise<Record<string, number> | null> {
  const [cached] = await db().select().from(exchangeRates).where(eq(exchangeRates.base, base));
  if (cached && now.getTime() - cached.fetchedAt.getTime() < MAX_AGE_MS) return cached.rates;

  const sourceFailures = failures.get(source) ?? new Map<string, number>();
  failures.set(source, sourceFailures);
  const failedAt = sourceFailures.get(base);
  if (failedAt !== undefined && now.getTime() - failedAt < RETRY_AFTER_MS) {
    return cached?.rates ?? null;
  }

  try {
    const rates = await source(base);
    await db()
      .insert(exchangeRates)
      .values({ base, rates, fetchedAt: now })
      .onConflictDoUpdate({ target: exchangeRates.base, set: { rates, fetchedAt: now } });
    sourceFailures.delete(base);
    return rates;
  } catch (error) {
    sourceFailures.set(base, now.getTime());
    console.warn(
      `[fx] Could not refresh ${base.toUpperCase()} rates:`,
      error instanceof Error ? error.message : error,
    );
    return cached?.rates ?? null;
  }
}

export interface CurrencyConverter {
  /** Converts a minor-unit amount to the target currency; `null` without a rate. */
  convert(amount: number, currency: string): number | null;
  /** Currencies that could not be converted. */
  readonly unavailable: ReadonlySet<string>;
}

/**
 * Converts amounts of `currencies` to `target`, only fetching rates when a currency differs.
 * Past amounts use today's rate as well: a chart of MRR should show the business growing, not
 * exchange rates moving.
 */
export async function createCurrencyConverter(
  target: string,
  currencies: Iterable<string>,
  options: ExchangeRateOptions = {},
): Promise<CurrencyConverter> {
  const foreign = [...new Set(currencies)].filter((currency) => currency !== target);
  const rates = foreign.length ? await getExchangeRates(target, options) : null;
  const rateOf = (currency: string) => rates?.[currency];

  return {
    unavailable: new Set(foreign.filter((currency) => !rateOf(currency))),
    convert(amount, currency) {
      if (currency === target) return amount;
      const rate = rateOf(currency);
      // Rates are quoted per unit of the target currency: invert them to convert into it.
      return rate ? convertAmount(amount, currency, target, 1 / rate) : null;
    },
  };
}
