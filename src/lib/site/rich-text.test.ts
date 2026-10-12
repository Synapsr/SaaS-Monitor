import { describe, expect, it } from "vitest";
import { en } from "./i18n/en";
import { parseRichText, plainText, siteLinks } from "./rich-text";
import { SITE_LANGUAGES } from "./languages";
import { siteTexts } from "./i18n";

describe("parseRichText", () => {
  it("splits links and emphasis from the text around them", () => {
    expect(parseRichText("Open **Settings**, then [the guide](wall).")).toEqual([
      { type: "text", text: "Open " },
      { type: "strong", text: "Settings" },
      { type: "text", text: ", then " },
      { type: "link", text: "the guide", key: "wall" },
      { type: "text", text: "." },
    ]);
  });

  it("keeps a text without markup whole", () => {
    expect(parseRichText("Just words.")).toEqual([{ type: "text", text: "Just words." }]);
  });
});

describe("plainText", () => {
  it("drops the markup, keeping the words", () => {
    expect(plainText("Revoke it any time. [See every permission](permissions)")).toBe(
      "Revoke it any time. See every permission",
    );
  });
});

describe("site texts", () => {
  /** Every `[words](key)` of a language, wherever it is in its texts. */
  function linkKeys(value: unknown): string[] {
    if (typeof value === "string") {
      return parseRichText(value).flatMap((part) => (part.type === "link" ? [part.key] : []));
    }
    if (typeof value === "object" && value !== null) return Object.values(value).flatMap(linkKeys);
    return [];
  }

  it.each(SITE_LANGUAGES)("%s only links to known places", (language) => {
    const links = siteLinks(language);
    for (const key of linkKeys(siteTexts[language])) expect(links, key).toHaveProperty(key);
  });

  it.each(SITE_LANGUAGES)("%s keeps every link of English", (language) => {
    expect(linkKeys(siteTexts[language]).sort()).toEqual(linkKeys(en).sort());
  });
});
