import { describe, expect, it } from "vitest";
import { parseDemoOptions } from "@/lib/display/demo/options";

describe("demo options", () => {
  it("reads the query parameters, ignoring unknown values", () => {
    expect(
      parseDemoOptions({
        accent: "violet",
        sound: "arcade",
        names: "1",
        range: "12m",
        metric: "arr",
        tz: "Europe/Paris",
        preview: "1",
      }),
    ).toEqual({
      options: {
        accent: "violet",
        soundPack: "arcade",
        showCustomerNames: true,
        chartRange: "12m",
        metric: "arr",
        timeZone: "Europe/Paris",
      },
      preview: true,
    });
    expect(
      parseDemoOptions({ accent: "pink", range: "5y", metric: "qrr", tz: "Mars/Olympus" }),
    ).toEqual({
      options: {
        accent: "emerald",
        soundPack: "register",
        showCustomerNames: false,
        chartRange: "90d",
        metric: "mrr",
        timeZone: "America/New_York",
      },
      preview: false,
    });
    expect(parseDemoOptions({ sound: "off" }).options.soundPack).toBeNull();
  });
});
