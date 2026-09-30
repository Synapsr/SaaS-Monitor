import { describe, expect, it } from "vitest";
import {
  defaultScreenSettings,
  isCustomAccent,
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
    // POSIX signs, which MySQL's time zone tables follow too: UTC−5 in both.
    expect(isTimeZone("Etc/GMT+5")).toBe(true);
  });

  it("refuses offsets, some of which MySQL cannot read", () => {
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

describe("accent", () => {
  it("is a preset, or a custom hex color stored in lowercase", () => {
    expect(defaultScreenSettings.accent).toBe("emerald");
    expect(screenSettingsSchema.parse({ accent: "violet" }).accent).toBe("violet");
    expect(screenSettingsSchema.parse({ accent: "#FF6B35" }).accent).toBe("#ff6b35");
  });

  it("refuses other colors, and falls back to the default one", () => {
    for (const accent of ["pink", "#fff", "ff6b35", "#ff6b3", "rgb(255 0 0)"]) {
      expect(screenSettingsSchema.safeParse({ accent }).success, accent).toBe(false);
    }
    expect(parseScreenSettings({ accent: "#12345z", theme: "light" })).toMatchObject({
      accent: "emerald",
      theme: "light",
    });
  });

  it("recognizes custom accents", () => {
    expect(isCustomAccent("#ff6b35")).toBe(true);
    expect(isCustomAccent("#FF6B35")).toBe(true);
    expect(isCustomAccent("emerald")).toBe(false);
  });
});

describe("theme, language and rotation", () => {
  it("default to a dark screen in English showing its accounts combined", () => {
    expect(parseScreenSettings({ currency: "eur" })).toMatchObject({
      theme: "dark",
      language: "en",
      rotation: { enabled: false, seconds: 15, includeTotal: true },
      sound: { onCustomer: true },
      momentSeconds: 10,
    });
  });

  it("keep what screens choose", () => {
    const settings = { theme: "light", language: "fr", rotation: { enabled: true, seconds: 30 } };
    expect(screenSettingsSchema.parse(settings)).toMatchObject({
      theme: "light",
      language: "fr",
      rotation: { enabled: true, seconds: 30, includeTotal: true },
    });
  });

  it("refuse moments too short to read, or long enough to hide the screen", () => {
    for (const momentSeconds of [2, 61, 7.5]) {
      expect(screenSettingsSchema.safeParse({ momentSeconds }).success, `${momentSeconds}`).toBe(
        false,
      );
    }
    expect(parseScreenSettings({ momentSeconds: 2, theme: "light" })).toMatchObject({
      momentSeconds: 10,
      theme: "light",
    });
  });

  it("refuse rotations too fast or too slow to follow", () => {
    for (const seconds of [4, 301, 12.5]) {
      expect(screenSettingsSchema.safeParse({ rotation: { seconds } }).success, `${seconds}`).toBe(
        false,
      );
    }
  });
});

describe("voice", () => {
  it("is off by default, and quiet about losses once on", () => {
    expect(defaultScreenSettings.voice).toMatchObject({
      enabled: false,
      voiceId: null,
      personalized: false,
      phrases: {},
    });
    expect(defaultScreenSettings.voice.announce).toMatchObject({
      payment: true,
      connectPayment: true,
      subscription: true,
      downgrade: false,
      cancellation: false,
      unpaid: false,
    });
  });

  it("keeps a screen's own phrases, per announcement", () => {
    const { voice } = screenSettingsSchema.parse({
      voice: {
        enabled: true,
        voiceId: "marius",
        phrases: { payment: ["{name} a payé {amount} !"] },
      },
    });
    expect(voice).toMatchObject({ enabled: true, voiceId: "marius" });
    expect(voice.phrases).toEqual({ payment: ["{name} a payé {amount} !"] });
  });

  it("forgets a voice that no longer exists, but not the rest of the voice settings", () => {
    expect(parseScreenSettings({ voice: { enabled: true, voiceId: "hal" } }).voice).toMatchObject({
      enabled: true,
      voiceId: null,
    });
  });

  it("refuses phrases too long to say, or too many of them", () => {
    const phrases = (list: string[]) =>
      screenSettingsSchema.safeParse({ voice: { phrases: { payment: list } } }).success;
    expect(phrases(["x".repeat(160)])).toBe(true);
    expect(phrases(["x".repeat(161)])).toBe(false);
    expect(phrases(Array.from({ length: 6 }, () => "Ka-ching!"))).toBe(false);
  });
});

describe("customer emails", () => {
  it("are hidden by default, and may be masked or shown in full", () => {
    expect(defaultScreenSettings.customerEmails).toBe("hidden");
    expect(screenSettingsSchema.parse({ customerEmails: "masked" }).customerEmails).toBe("masked");
    expect(parseScreenSettings({ customerEmails: "raw", showCustomerNames: true })).toMatchObject({
      customerEmails: "hidden",
      showCustomerNames: true,
    });
  });
});
