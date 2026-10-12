import { describe, expect, it } from "vitest";
import { formatCount, formatDollars, formatPercent, languageName, regionName } from "./format";

/** Intl separates thousands with no-break spaces in some languages: compare them as spaces. */
const spaced = (text: string) => text.replace(/[  ]/g, " ");

describe("site formats", () => {
  it("writes star counts compactly past a thousand", () => {
    expect(formatCount(4, "en-US")).toBe("4");
    expect(formatCount(1234, "en-US")).toBe("1.2K");
    expect(spaced(formatCount(1234, "fr-FR"))).toBe("1,2 k");
  });

  it("writes the demo's dollars as screens do", () => {
    expect(formatDollars(14_880, "en-US")).toBe("$14,880");
    expect(spaced(formatDollars(14_880, "de-DE"))).toBe("14.880 $");
    expect(formatDollars(2_345, "en-US", { signed: true })).toBe("+$2,345");
    expect(formatDollars(10_000, "en-US", { compact: true })).toBe("$10K");
  });

  it("writes shares with the language's spacing", () => {
    expect(formatPercent(0.19, "en-US", { signed: true })).toBe("+19%");
    expect(spaced(formatPercent(0.19, "fr-FR", { signed: true }))).toBe("+19 %");
  });

  it("names countries and languages in the page's language", () => {
    expect(regionName("NL", "de-DE")).toBe("Niederlande");
    expect(languageName("fr", "fr-FR")).toBe("français");
    expect(languageName("fr", "fr-FR", { capitalized: true })).toBe("Français");
    expect(languageName("de", "en-US")).toBe("German");
  });
});
