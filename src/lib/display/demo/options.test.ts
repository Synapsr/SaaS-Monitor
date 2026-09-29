import { describe, expect, it } from "vitest";
import { parseDemoOptions } from "@/lib/display/demo/options";

describe("demo options", () => {
  it("reads the query parameters, ignoring unknown values", () => {
    expect(
      parseDemoOptions({
        accent: "violet",
        theme: "light",
        lang: "fr",
        sound: "arcade",
        voice: "marius",
        names: "1",
        range: "12m",
        metric: "arr",
        tz: "Europe/Paris",
        preview: "1",
      }),
    ).toEqual({
      options: {
        accent: "violet",
        theme: "light",
        language: "fr",
        soundPack: "arcade",
        voice: { enabled: true, voiceId: "marius" },
        showCustomerNames: true,
        chartRange: "12m",
        metric: "arr",
        timeZone: "Europe/Paris",
        accounts: 1,
        rotation: true,
      },
      preview: true,
    });
    expect(
      parseDemoOptions({
        accent: "pink",
        theme: "sepia",
        lang: "tlh",
        range: "5y",
        metric: "qrr",
        tz: "Mars/Olympus",
      }),
    ).toEqual({
      options: {
        accent: "emerald",
        theme: "dark",
        language: "en",
        soundPack: "register",
        voice: { enabled: true, voiceId: null },
        showCustomerNames: false,
        chartRange: "90d",
        metric: "mrr",
        timeZone: "America/New_York",
        accounts: 1,
        rotation: true,
      },
      preview: false,
    });
    expect(parseDemoOptions({ sound: "off" }).options.soundPack).toBeNull();
    expect(parseDemoOptions({ voice: "off" }).options.voice.enabled).toBe(false);
  });

  it("takes custom accents as hex colors, with or without their #", () => {
    expect(parseDemoOptions({ accent: "#FF6B35" }).options.accent).toBe("#ff6b35");
    expect(parseDemoOptions({ accent: "ff6b35" }).options.accent).toBe("#ff6b35");
    expect(parseDemoOptions({ accent: "#ff6b3" }).options.accent).toBe("emerald");
  });

  it("shows two accounts taking turns with ?accounts=2, or added up with ?rotate=0", () => {
    expect(parseDemoOptions({ accounts: "2" }).options).toMatchObject({
      accounts: 2,
      rotation: true,
    });
    expect(parseDemoOptions({ accounts: "2", rotate: "0" }).options.rotation).toBe(false);
    expect(parseDemoOptions({ accounts: "7" }).options.accounts).toBe(1);
  });

  it("shows the whole simulated history with ?range=all", () => {
    expect(parseDemoOptions({ range: "all" }).options.chartRange).toBe("all");
  });
});
