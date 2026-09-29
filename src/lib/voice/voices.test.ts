import { describe, expect, it } from "vitest";
import { screenVoice, VOICE_LANGUAGES, VOICES, voicesOf } from "./voices";

describe("voices", () => {
  it("speak every language of Gradium, two voices each", () => {
    for (const language of VOICE_LANGUAGES) expect(voicesOf(language)).toHaveLength(2);
    expect(new Set(VOICES.map((voice) => voice.id)).size).toBe(VOICES.length);
  });

  it("keep a screen's voice while it speaks the screen's language", () => {
    expect(screenVoice("fr", "marius")?.id).toBe("marius");
    expect(screenVoice("fr", null)?.id).toBe("maelys");
    // A screen switching to German leaves its French voice behind.
    expect(screenVoice("de", "marius")?.id).toBe("femke");
    expect(screenVoice("it", "marius")).toBeNull();
  });
});
