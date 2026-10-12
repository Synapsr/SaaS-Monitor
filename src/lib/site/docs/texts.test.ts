import { describe, expect, it } from "vitest";
import { SITE_LANGUAGES } from "@/lib/site/languages";
import { parseRichText, siteLinks } from "@/lib/site/rich-text";
import { en } from "./en";
import { docsTexts } from "./index";
import { DOCS_PAGES, DOCS_TEXT_KEYS } from "./pages";

/** Every string of a dictionary, wherever it is. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(strings);
  return [];
}

/** The parts of a kind in every string of a dictionary: its links' keys, or its code. */
function parts(value: unknown, type: "link" | "code"): string[] {
  return strings(value).flatMap((text) =>
    parseRichText(text).flatMap((part) => {
      if (part.type !== type) return [];
      return [part.type === "link" ? part.key : part.text];
    }),
  );
}

describe("docs texts", () => {
  it.each(SITE_LANGUAGES)("%s only links to known places", (language) => {
    const links = siteLinks(language);
    for (const key of parts(docsTexts[language], "link")) expect(links, key).toHaveProperty(key);
  });

  it.each(SITE_LANGUAGES)("%s keeps every link and every piece of code of English", (language) => {
    const text = docsTexts[language];
    expect(parts(text, "link").sort()).toEqual(parts(en, "link").sort());
    expect(parts(text, "code").sort()).toEqual(parts(en, "code").sort());
  });

  it.each(SITE_LANGUAGES)(
    "%s gives every page a title and a description for search",
    (language) => {
      for (const page of DOCS_PAGES) {
        const { meta } = docsTexts[language][DOCS_TEXT_KEYS[page]];
        expect(meta.title.length, `${page} title`).toBeLessThanOrEqual(62);
        expect(meta.description.length, `${page} description`).toBeLessThan(160);
      }
    },
  );

  it("sets French with narrow no-break spaces before high punctuation and inside quotes", () => {
    for (const text of strings(docsTexts.fr)) {
      expect(text, text).not.toMatch(/[ \u00a0][;:!?»]|«[ \u00a0]/);
    }
  });
});
