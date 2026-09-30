import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SOUND_PACKS } from "@/lib/screens/settings";
import { SOUND_RECIPES } from "@/lib/sounds/packs";
import { SOUND_EVENTS, SOUND_FILES, soundFile } from "./sound-files";

describe("soundFile", () => {
  it("serves each sound from its pack's folder, under a name that says where it comes from", () => {
    expect(soundFile("register", "mrrUp")).toEqual({
      pack: "register",
      event: "mrrUp",
      url: "/sounds/register/mrrUp.mp3",
      fileName: "saas-monitor-cash-register-mrr-up.mp3",
      title: "Cash register · MRR up",
    });
  });
});

describe("SOUND_FILES", () => {
  it("lists every sound of every pack once", () => {
    for (const pack of SOUND_PACKS) {
      expect(Object.keys(SOUND_RECIPES[pack]).sort()).toEqual([...SOUND_EVENTS].sort());
    }
    expect(SOUND_FILES).toHaveLength(SOUND_PACKS.length * SOUND_EVENTS.length);
    expect(new Set(SOUND_FILES.map((file) => file.fileName)).size).toBe(SOUND_FILES.length);
  });

  // `scripts/render-sounds.ts` writes them: run it again after changing a sound or a pack.
  it("has every file rendered, small enough to download anywhere", () => {
    for (const file of SOUND_FILES) {
      const onDisk = path.join("public", file.url);
      expect(existsSync(onDisk), onDisk).toBe(true);
      expect(statSync(onDisk).size).toBeLessThan(100_000);
    }
  });
});
