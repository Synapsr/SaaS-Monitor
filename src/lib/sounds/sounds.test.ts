import { describe, expect, it } from "vitest";
import { SOUND_PACKS } from "@/lib/screens/settings";
import { playSound, unlockAudio, type SoundEvent } from "@/lib/sounds";
import { SOUND_RECIPES } from "@/lib/sounds/packs";
import type { Voice } from "@/lib/sounds/synth";

const EVENTS: SoundEvent[] = ["payment", "mrrUp", "mrrDown", "milestone"];

/** Records automation and enforces the rules browsers throw on. */
class FakeParam {
  value = 0;
  readonly events: { type: "set" | "linear" | "exponential"; value: number; time: number }[] = [];

  private schedule(type: "set" | "linear" | "exponential", value: number, time: number) {
    if (!Number.isFinite(value) || !Number.isFinite(time) || time < 0) {
      throw new RangeError(`Invalid automation: ${type}(${value}, ${time})`);
    }
    this.events.push({ type, value, time });
    return this;
  }
  setValueAtTime(value: number, time: number) {
    return this.schedule("set", value, time);
  }
  linearRampToValueAtTime(value: number, time: number) {
    return this.schedule("linear", value, time);
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    if (value <= 0) throw new RangeError("Exponential ramps must target a positive value");
    return this.schedule("exponential", value, time);
  }
}

class FakeNode {
  connect<T>(node: T): T {
    return node;
  }
  disconnect() {}
}

class FakeSource extends FakeNode {
  readonly times: ["start" | "stop", number][] = [];
  readonly frequency = new FakeParam();
  type = "sine";
  buffer: unknown = null;
  start(time = 0) {
    this.times.push(["start", time]);
  }
  stop(time = 0) {
    this.times.push(["stop", time]);
  }
  setPeriodicWave() {}
}

class FakeContext {
  readonly sampleRate = 48_000;
  readonly currentTime = 0;
  readonly destination = new FakeNode();
  readonly sources: FakeSource[] = [];
  readonly envelopes: FakeParam[] = [];

  createOscillator() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }
  createBufferSource() {
    return this.createOscillator();
  }
  createGain() {
    const gain = new FakeParam();
    this.envelopes.push(gain);
    return Object.assign(new FakeNode(), { gain });
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode(), {
      type: "",
      frequency: new FakeParam(),
      Q: new FakeParam(),
    });
  }
  createStereoPanner() {
    return Object.assign(new FakeNode(), { pan: new FakeParam() });
  }
  createBuffer(_channels: number, length: number) {
    const samples = new Float32Array(length);
    return { getChannelData: () => samples };
  }
  createPeriodicWave() {
    return {};
  }
}

function render(pack: (typeof SOUND_PACKS)[number], event: SoundEvent) {
  const context = new FakeContext();
  const voice = {
    context,
    output: new FakeNode(),
    reverb: new FakeNode(),
  } as unknown as Voice;
  SOUND_RECIPES[pack][event](voice, 1);
  return context;
}

describe("sound packs", () => {
  const cases = SOUND_PACKS.flatMap((pack) => EVENTS.map((event) => [pack, event] as const));

  it.each(cases)("%s plays a short %s sound", (pack, event) => {
    const context = render(pack, event);
    const times = context.sources.flatMap((source) => source.times);
    expect(times.length).toBeGreaterThan(0);
    for (const [, time] of times) {
      expect(time).toBeGreaterThanOrEqual(1);
      expect(time).toBeLessThanOrEqual(1 + (event === "milestone" ? 3.5 : 2));
    }
  });

  it.each(cases)("%s %s starts every envelope from silence, without clicks", (pack, event) => {
    const envelopes = render(pack, event).envelopes.filter((param) => param.events.length > 0);
    expect(envelopes.length).toBeGreaterThan(0);
    for (const { events } of envelopes) {
      expect(events[0]).toMatchObject({ type: "set", value: 0 });
      expect(events[1].type).toBe("linear");
      // At least a millisecond (48 samples) of attack, give or take floating point rounding.
      expect(events[1].time - events[0].time).toBeGreaterThan(0.00099);
      expect(events.at(-1)?.type).toBe("exponential");
    }
  });
});

describe("sound engine", () => {
  it("is safe to use where there is no audio, like on the server", async () => {
    expect(() => playSound("payment", { pack: "register", volume: 1 })).not.toThrow();
    await expect(unlockAudio()).resolves.toBe(false);
  });
});
