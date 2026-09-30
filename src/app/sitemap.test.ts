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
    expect(urls).toContain("https://saas-monitor.com/sign-up");
    for (const url of urls) expect(url).toMatch(/^https:\/\/saas-monitor\.com\/(?!\/)/);
  });

  it("leaves screens, the dashboard and the API out", () => {
    for (const { url } of sitemap()) expect(url).not.toMatch(/\/(d|app|api|invite)(\/|$)/);
  });
});
