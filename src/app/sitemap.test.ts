import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  beforeEach(() => {
    vi.stubEnv("APP_URL", "https://saas-monitor.com/");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists the public pages with absolute URLs on APP_URL", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://saas-monitor.com/");
    expect(urls).toContain("https://saas-monitor.com/privacy");
    expect(urls).toContain("https://saas-monitor.com/alternatives/geckoboard");
    for (const url of urls) expect(url).toMatch(/^https:\/\/saas-monitor\.com\/(?!\/)/);
  });

  it("lists every language of a translated page, with its alternates", () => {
    const entries = sitemap();
    const french = entries.find((entry) => entry.url === "https://saas-monitor.com/fr");
    expect(french?.alternates?.languages).toEqual({
      en: "https://saas-monitor.com/",
      fr: "https://saas-monitor.com/fr",
      de: "https://saas-monitor.com/de",
      es: "https://saas-monitor.com/es",
      it: "https://saas-monitor.com/it",
      "pt-BR": "https://saas-monitor.com/pt",
      nl: "https://saas-monitor.com/nl",
      "x-default": "https://saas-monitor.com/",
    });
    const sounds = entries.filter((entry) => entry.url.endsWith("/stripe-notification-sound"));
    expect(sounds).toHaveLength(7);
  });

  it("gives pages written only in English no alternates", () => {
    const changelog = sitemap().find((entry) => entry.url.endsWith("/changelog"));
    expect(changelog).toEqual({ url: "https://saas-monitor.com/changelog" });
  });

  it("leaves screens, the dashboard, the API and the auth pages out", () => {
    for (const { url } of sitemap()) {
      expect(url).not.toMatch(/\/(d|app|api|invite|sign-in|sign-up)(\/|$)/);
    }
  });
});
