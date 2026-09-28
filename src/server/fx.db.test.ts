import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "@/test/db";
import { createCurrencyConverter, frankfurterRates, getExchangeRates } from "./fx";

const NOW = new Date("2026-03-15T12:00:00Z");
const hoursLater = (hours: number) => new Date(NOW.getTime() + hours * 3600 * 1000);

describe("exchange rates", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches rates once and serves them from the database for 12 hours", async () => {
    const source = vi.fn(async () => ({ eur: 0.8 }));

    expect(await getExchangeRates("usd", { source, now: NOW })).toEqual({ eur: 0.8 });
    expect(await getExchangeRates("usd", { source, now: hoursLater(11) })).toEqual({ eur: 0.8 });
    expect(source).toHaveBeenCalledTimes(1);

    source.mockResolvedValueOnce({ eur: 0.9 });
    expect(await getExchangeRates("usd", { source, now: hoursLater(13) })).toEqual({ eur: 0.9 });
  });

  it("keeps stale rates when they cannot be refreshed, and waits before trying again", async () => {
    await getExchangeRates("usd", { source: async () => ({ eur: 0.8 }), now: NOW });
    const failing = vi.fn(async (): Promise<Record<string, number>> => {
      throw new Error("Service unavailable");
    });

    expect(await getExchangeRates("usd", { source: failing, now: hoursLater(13) })).toEqual({
      eur: 0.8,
    });
    expect(await getExchangeRates("usd", { source: failing, now: hoursLater(13.05) })).toEqual({
      eur: 0.8,
    });
    expect(failing).toHaveBeenCalledTimes(1);
    await getExchangeRates("usd", { source: failing, now: hoursLater(13.1) });
    expect(failing).toHaveBeenCalledTimes(2);
  });

  it("has nothing to offer when rates were never fetched", async () => {
    const failing = async () => {
      throw new Error("Service unavailable");
    };
    expect(await getExchangeRates("chf", { source: failing, now: NOW })).toBeNull();
  });

  it("converts to the target currency and lists what it cannot convert", async () => {
    const source = vi.fn(async () => ({ eur: 0.8, jpy: 150 }));

    const converter = await createCurrencyConverter("usd", ["usd", "eur", "jpy", "xof"], {
      source,
      now: NOW,
    });

    expect(converter.convert(1000, "eur")).toBe(1250);
    // 15,000 yen (no minor unit) are worth $100.00.
    expect(converter.convert(15_000, "jpy")).toBe(10_000);
    expect(converter.convert(500, "usd")).toBe(500);
    expect(converter.convert(500, "xof")).toBeNull();
    expect([...converter.unavailable]).toEqual(["xof"]);
  });

  it("does not ask for rates when every amount is in the target currency", async () => {
    const source = vi.fn(async () => ({}));

    const converter = await createCurrencyConverter("eur", ["eur", "eur"], { source, now: NOW });

    expect(converter.convert(42, "eur")).toBe(42);
    expect(source).not.toHaveBeenCalled();
  });

  it("reads the European Central Bank rates from Frankfurter", async () => {
    const fetch = vi.fn(async () =>
      Response.json({ amount: 1, base: "USD", date: "2026-03-13", rates: { EUR: 0.8, GBP: 0.7 } }),
    );
    vi.stubGlobal("fetch", fetch);

    expect(await frankfurterRates("usd")).toEqual({ eur: 0.8, gbp: 0.7 });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.frankfurter.dev/v1/latest?base=USD",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("fails on an unexpected answer from Frankfurter", async () => {
    vi.stubGlobal("fetch", async () => new Response("Not found", { status: 404 }));
    await expect(frankfurterRates("xyz")).rejects.toThrow("404");
  });
});
