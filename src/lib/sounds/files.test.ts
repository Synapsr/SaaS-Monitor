import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SOUND_PACKS } from "@/lib/screens/settings";
import type { SoundEvent } from "@/lib/sounds";
import { SOUND_RECIPES } from "@/lib/sounds/packs";

/** The rendered sounds the app and its notifications play (`scripts/generate-sounds.ts`). */
describe("sound files", () => {
  const cases = SOUND_PACKS.flatMap((pack) =>
    (Object.keys(SOUND_RECIPES[pack]) as SoundEvent[]).map((event) => [pack, event] as const),
  );

  it.each(cases)("%s %s is rendered: a short mono 16-bit WAV", (pack, event) => {
    const file = readFileSync(path.join("public", "sounds", pack, `${event}.wav`));
    expect(file.toString("ascii", 0, 4)).toBe("RIFF");
    expect(file.toString("ascii", 8, 12)).toBe("WAVE");
    expect(file.readUInt16LE(20)).toBe(1); // Linear PCM.
    expect(file.readUInt16LE(22)).toBe(1); // Mono.
    const sampleRate = file.readUInt32LE(24);
    expect(sampleRate).toBeLessThanOrEqual(44_100);
    expect(file.readUInt16LE(34)).toBe(16);
    const seconds = file.readUInt32LE(40) / 2 / sampleRate;
    expect(seconds).toBeGreaterThan(0.2);
    // Under iOS's 30 seconds for a notification sound, with room for the voice after it.
    expect(seconds).toBeLessThan(event === "milestone" ? 5 : 3);
  });
});
