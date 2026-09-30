import { describe, expect, it } from "vitest";
import { parseAnalyticsConfig } from "./config";

describe("parseAnalyticsConfig", () => {
  it("is off without a domain", () => {
    expect(parseAnalyticsConfig({})).toBeNull();
    expect(parseAnalyticsConfig({ PLAUSIBLE_DOMAIN: "", PLAUSIBLE_HOST: "" })).toBeNull();
    expect(parseAnalyticsConfig({ PLAUSIBLE_DOMAIN: "  " })).toBeNull();
    expect(parseAnalyticsConfig({ PLAUSIBLE_HOST: "https://stats.example.com" })).toBeNull();
  });

  it("sends to plausible.io by default", () => {
    expect(parseAnalyticsConfig({ PLAUSIBLE_DOMAIN: "saas-monitor.com" })).toEqual({
      domain: "saas-monitor.com",
      host: "https://plausible.io",
    });
  });

  it("accepts a self-hosted server and several sites", () => {
    expect(
      parseAnalyticsConfig({
        PLAUSIBLE_DOMAIN: " SaaS-Monitor.com, rollup.example.com ",
        PLAUSIBLE_HOST: "https://stats.example.com/",
      }),
    ).toEqual({ domain: "saas-monitor.com,rollup.example.com", host: "https://stats.example.com" });
  });

  it.each([
    { PLAUSIBLE_DOMAIN: "https://saas-monitor.com" },
    { PLAUSIBLE_DOMAIN: "saas-monitor.com/app" },
    { PLAUSIBLE_DOMAIN: "saas-monitor.com", PLAUSIBLE_HOST: "plausible.io" },
    { PLAUSIBLE_DOMAIN: "saas-monitor.com", PLAUSIBLE_HOST: "ftp://plausible.io" },
  ])("refuses %j", (variables) => {
    expect(() => parseAnalyticsConfig(variables)).toThrow(/Invalid analytics configuration/);
  });
});
