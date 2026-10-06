import { describe, expect, it } from "vitest";
import { MAX_SPEECH_WAIT_S, SPEECH_GAP_S, speechSlot } from "./audio-timing";

describe("speechSlot", () => {
  const ready = { now: 100, elapsedMs: 0, delayMs: 900, busyUntil: 0, duration: 2 };

  it("starts a phrase once the moment's sound has rung", () => {
    expect(speechSlot(ready)).toEqual({ start: 100.9, busyUntil: 100.9 + 2 + SPEECH_GAP_S });
    // Ready late: only what is left of the sound's lead.
    expect(speechSlot({ ...ready, elapsedMs: 600 })?.start).toBeCloseTo(100.3);
    expect(speechSlot({ ...ready, elapsedMs: 2_000 })?.start).toBe(100);
  });

  it("waits for the phrase being said, a breath apart, but not too long", () => {
    expect(speechSlot({ ...ready, busyUntil: 102 })?.start).toBe(102);
    expect(speechSlot({ ...ready, busyUntil: 100.9 + MAX_SPEECH_WAIT_S })).not.toBeNull();
    expect(speechSlot({ ...ready, busyUntil: 101 + MAX_SPEECH_WAIT_S })).toBeNull();
  });
});
