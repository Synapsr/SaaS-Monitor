import { describe, expect, it } from "vitest";
import { defaultScreenSettings } from "@/lib/screens/settings";
import { screenInputSchema } from "./screens";

describe("screen input", () => {
  const input = { name: " Lobby ", accountIds: [], settings: defaultScreenSettings };

  it("trims the name", () => {
    expect(screenInputSchema.parse(input).name).toBe("Lobby");
  });

  it("rejects what a forged request could send", () => {
    const { settings } = input;
    for (const invalid of [
      { ...settings, accent: "neon" },
      { ...settings, goal: -5 },
      { ...settings, currency: "dollars" },
      { ...settings, sound: { ...settings.sound, volume: 3 } },
    ]) {
      expect(screenInputSchema.safeParse({ ...input, settings: invalid }).success).toBe(false);
    }
    expect(screenInputSchema.safeParse({ ...input, accountIds: ["not-a-uuid"] }).success).toBe(
      false,
    );
    expect(screenInputSchema.safeParse({ ...input, name: "  " }).error?.issues[0].message).toBe(
      "Give the screen a name.",
    );
  });
});
