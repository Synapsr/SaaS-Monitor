import { describe, expect, it } from "vitest";
import { isSiteLanguage, preferredLanguage } from "./languages";

describe("isSiteLanguage", () => {
  it("knows the languages of screens only", () => {
    expect(isSiteLanguage("fr")).toBe(true);
    expect(isSiteLanguage("pt")).toBe(true);
    expect(isSiteLanguage("pt-BR")).toBe(false);
    expect(isSiteLanguage("ja")).toBe(false);
    expect(isSiteLanguage(undefined)).toBe(false);
  });
});

describe("preferredLanguage", () => {
  it("takes the first language the site speaks, whatever its region", () => {
    expect(preferredLanguage(["fr-CH", "en"])).toBe("fr");
    expect(preferredLanguage(["ja-JP", "pt-PT", "en-US"])).toBe("pt");
    expect(preferredLanguage(["NL"])).toBe("nl");
  });

  it("is null when the browser speaks none of them", () => {
    expect(preferredLanguage(["ja", "zh-CN"])).toBeNull();
    expect(preferredLanguage([])).toBeNull();
  });
});
