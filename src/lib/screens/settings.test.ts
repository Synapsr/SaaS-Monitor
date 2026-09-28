import { describe, expect, it } from "vitest";
import {
  defaultScreenSettings,
  isTimeZone,
  parseScreenSettings,
  screenSettingsSchema,
} from "./settings";

describe("metric", () => {
  it("is MRR by default, for new screens and those saved before it existed", () => {
    expect(defaultScreenSettings.metric).toBe("mrr");
    expect(parseScreenSettings({ currency: "eur", goal: 15_000 })).toMatchObject({
      metric: "mrr",
      goal: 15_000,
    });
  });

  it("can be ARR, the goal then being an ARR target", () => {
    expect(screenSettingsSchema.parse({ metric: "arr", goal: 1_000_000 })).toMatchObject({
      metric: "arr",
      goal: 1_000_000,
    });
  });

  it("refuses other metrics, and falls back to MRR without losing the other settings", () => {
    expect(screenSettingsSchema.safeParse({ metric: "qrr" }).success).toBe(false);
    expect(parseScreenSettings({ metric: "qrr", goal: 15_000 })).toMatchObject({
      metric: "mrr",
      goal: 15_000,
    });
  });
});

describe("time zones", () => {
  it("accepts IANA names, including the aliases browsers may report", () => {
    for (const zone of ["UTC", "Europe/Paris", "America/Argentina/Buenos_Aires", "Asia/Calcutta"]) {
      expect(isTimeZone(zone), zone).toBe(true);
    }
    expect(isTimeZone("Asia/Kolkata")).toBe(true);
    // POSIX signs, like PostgreSQL: UTC−5 in both.
    expect(isTimeZone("Etc/GMT+5")).toBe(true);
  });

  it("refuses offsets, which PostgreSQL reads with the opposite sign", () => {
    for (const zone of ["+05:30", "-03:00", "+0530", "+05"]) {
      expect(isTimeZone(zone), zone).toBe(false);
    }
    expect(screenSettingsSchema.safeParse({ timeZone: "+05:30" }).success).toBe(false);
    expect(parseScreenSettings({ timeZone: "+05:30" }).timeZone).toBe("UTC");
  });

  it("refuses unknown names", () => {
    expect(isTimeZone("Mars/Olympus")).toBe(false);
    expect(isTimeZone("")).toBe(false);
  });
});
