import { describe, expect, it } from "vitest";
import { canonicalUrl, languageAlternates, localizedPath, pathIn } from "./paths";

describe("localizedPath", () => {
  it("keeps English unprefixed and prefixes the other languages", () => {
    expect(localizedPath("en", "/")).toBe("/");
    expect(localizedPath("en", "/stripe-notification-sound")).toBe("/stripe-notification-sound");
    expect(localizedPath("fr", "/")).toBe("/fr");
    expect(localizedPath("pt", "/stripe-notification-sound")).toBe("/pt/stripe-notification-sound");
  });
});

describe("pathIn", () => {
  it("links to the same page when it is translated, else to the language's home", () => {
    expect(pathIn("de", "/stripe-notification-sound")).toBe("/de/stripe-notification-sound");
    expect(pathIn("fr", "/docs")).toBe("/fr/docs");
    expect(pathIn("nl", "/docs/security")).toBe("/nl/docs/security");
    expect(pathIn("de", "/privacy")).toBe("/de");
    expect(pathIn("en", "/changelog")).toBe("/");
  });
});

describe("canonicalUrl", () => {
  it("points to the hosted site, whichever instance serves the page", () => {
    expect(canonicalUrl("en", "/")).toBe("https://saas-monitor.com/");
    expect(canonicalUrl("nl", "/")).toBe("https://saas-monitor.com/nl");
    expect(canonicalUrl("en", "/privacy")).toBe("https://saas-monitor.com/privacy");
  });
});

describe("languageAlternates", () => {
  it("lists the docs in every language", () => {
    expect(languageAlternates("/docs/get-started")).toMatchObject({
      en: "https://saas-monitor.com/docs/get-started",
      "pt-BR": "https://saas-monitor.com/pt/docs/get-started",
      "x-default": "https://saas-monitor.com/docs/get-started",
    });
  });

  it("lists every language by its hreflang, and English as the default", () => {
    expect(languageAlternates("/stripe-notification-sound")).toEqual({
      en: "https://saas-monitor.com/stripe-notification-sound",
      fr: "https://saas-monitor.com/fr/stripe-notification-sound",
      de: "https://saas-monitor.com/de/stripe-notification-sound",
      es: "https://saas-monitor.com/es/stripe-notification-sound",
      it: "https://saas-monitor.com/it/stripe-notification-sound",
      "pt-BR": "https://saas-monitor.com/pt/stripe-notification-sound",
      nl: "https://saas-monitor.com/nl/stripe-notification-sound",
      "x-default": "https://saas-monitor.com/stripe-notification-sound",
    });
  });
});
