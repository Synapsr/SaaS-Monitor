import { describe, expect, it } from "vitest";
import {
  ALTERNATIVES,
  alternativeBySlug,
  formatCheckedDate,
  sourcedFacts,
  sourcesOf,
} from "./alternatives";

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

describe("ALTERNATIVES", () => {
  it("has one page per tool, at a readable address", () => {
    const slugs = ALTERNATIVES.map((alternative) => alternative.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  // A comparison may only say what the other product's own site says, and when it said it.
  it("sources every fact about another product from that product's own site", () => {
    for (const alternative of ALTERNATIVES) {
      for (const fact of sourcedFacts(alternative)) {
        expect(fact.source, fact.text).toMatch(/^https:\/\//);
        expect(host(fact.source), fact.text).toBe(host(alternative.website));
        expect(fact.checked, fact.text).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isNaN(Date.parse(fact.checked)), fact.text).toBe(false);
      }
    }
  });

  it("gives every page the parts it renders", () => {
    for (const alternative of ALTERNATIVES) {
      expect(alternative.rows.length, alternative.slug).toBeGreaterThanOrEqual(4);
      expect(alternative.pickThem.length, alternative.slug).toBeGreaterThan(0);
      expect(alternative.pickUs.length, alternative.slug).toBeGreaterThan(0);
      expect(alternative.faq.length, alternative.slug).toBeGreaterThan(0);
      // Search results cut longer descriptions.
      expect(alternative.description.length, alternative.slug).toBeLessThanOrEqual(220);
    }
  });
});

describe("alternativeBySlug", () => {
  it("finds a tool by its address, and nothing else", () => {
    expect(alternativeBySlug("geckoboard")?.name).toBe("Geckoboard");
    expect(alternativeBySlug("GECKOBOARD")).toBeUndefined();
    expect(alternativeBySlug("toString")).toBeUndefined();
  });
});

describe("sourcesOf", () => {
  it("lists each page once, in order of appearance", () => {
    const geckoboard = alternativeBySlug("geckoboard")!;
    expect(sourcesOf(geckoboard)).toEqual([
      "https://www.geckoboard.com/pricing/",
      "https://www.geckoboard.com/product/data-sources/stripe/",
    ]);
  });
});

describe("formatCheckedDate", () => {
  it("writes the day in full, whatever the time zone", () => {
    expect(formatCheckedDate("2026-09-30")).toBe("September 30, 2026");
  });
});
