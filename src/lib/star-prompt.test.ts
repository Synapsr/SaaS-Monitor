import { describe, expect, it } from "vitest";
import { isHostedInstance } from "@/lib/site";
import { LATER_MS, parseStarAnswer, starPromptDue } from "./star-prompt";

describe("star prompt", () => {
  const now = Date.parse("2026-09-30T12:00:00Z");

  it("asks a browser that never answered", () => {
    expect(starPromptDue(parseStarAnswer(null), now)).toBe(true);
  });

  it("never asks again once starred or declined", () => {
    expect(starPromptDue(parseStarAnswer('{"answer":"starred"}'), now)).toBe(false);
    expect(starPromptDue(parseStarAnswer('{"answer":"never"}'), now)).toBe(false);
  });

  it("asks again a day after “maybe later”", () => {
    const later = JSON.stringify({ answer: "later", until: now + LATER_MS });
    expect(starPromptDue(parseStarAnswer(later), now)).toBe(false);
    expect(starPromptDue(parseStarAnswer(later), now + LATER_MS)).toBe(true);
  });

  it("treats anything else stored as no answer", () => {
    for (const stored of ["{", "42", '{"answer":"maybe"}', '{"answer":"later"}']) {
      expect(parseStarAnswer(stored), stored).toBeNull();
    }
  });
});

describe("hosted instance", () => {
  it("is the project's own domain, whatever the path", () => {
    expect(isHostedInstance("https://saas-monitor.com")).toBe(true);
    expect(isHostedInstance("https://saas-monitor.com/")).toBe(true);
    expect(isHostedInstance("https://monitor.acme.com")).toBe(false);
    expect(isHostedInstance("http://localhost:3000")).toBe(false);
  });
});
