import { describe, expect, it } from "vitest";
import { playSound, unlockAudio } from "@/lib/sounds";

describe("sound engine", () => {
  it("is safe to use where there is no audio, like on the server", async () => {
    expect(() => playSound("payment", { pack: "register", volume: 1 })).not.toThrow();
    await expect(unlockAudio()).resolves.toBe(false);
  });
});
