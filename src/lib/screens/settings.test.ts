import { describe, expect, it } from "vitest";
import { isTimeZone, parseScreenSettings, screenSettingsSchema } from "./settings";

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
