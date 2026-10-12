import { describe, expect, it } from "vitest";
import { screenSettingsSchema, type ScreenSettingsInput } from "@/lib/screens/settings";
import { screenTags } from "./screen-tags";

const settings = (input: ScreenSettingsInput = {}) => screenSettingsSchema.parse(input);

describe("screen tags", () => {
  it("leave out the defaults", () => {
    const office = settings();
    const paris = settings({ language: "fr", sound: { pack: "chime" } });
    expect(screenTags(office, [office])).toEqual([]);
    expect(screenTags(office, [office, paris])).toEqual([]);
  });

  it("name a language or a sound that differs from the defaults", () => {
    const paris = settings({ language: "fr", sound: { pack: "chime" } });
    expect(screenTags(paris, [paris])).toEqual([
      { kind: "language", label: "Français" },
      { kind: "sound", label: "Chime" },
    ]);
    expect(screenTags(paris, [settings(), paris])).toHaveLength(2);
  });

  it("leave out what every screen of the list shares: it tells none of them apart", () => {
    const paris = settings({ language: "fr", sound: { pack: "chime" } });
    const lyon = settings({ language: "fr", sound: { pack: "arcade" } });
    expect(screenTags(paris, [paris, lyon])).toEqual([{ kind: "sound", label: "Chime" }]);
  });

  it("always say when a screen is silent, and when it speaks", () => {
    const quiet = settings({ sound: { enabled: false, pack: "arcade" } });
    expect(screenTags(quiet, [quiet, quiet])).toEqual([{ kind: "muted", label: "Sound off" }]);

    const speaking = settings({ voice: { enabled: true } });
    expect(screenTags(speaking, [speaking, speaking])).toEqual([{ kind: "voice", label: "Voice" }]);
  });
});
