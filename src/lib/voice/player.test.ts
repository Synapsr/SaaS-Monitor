import { beforeEach, describe, expect, it, vi } from "vitest";
import { hush, speak } from "./player";

interface FakeSource {
  buffer: AudioBuffer | null;
  onended: (() => void) | null;
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

const sources: FakeSource[] = [];

const context = {
  state: "running",
  currentTime: 0,
  resume: vi.fn(async () => {}),
  createBufferSource: (): FakeSource => {
    const gain = { connect: vi.fn() };
    const source: FakeSource = {
      buffer: null,
      onended: null,
      connect: vi.fn(() => gain),
      start: vi.fn(),
      stop: vi.fn(),
    };
    sources.push(source);
    return source;
  },
  createGain: () => ({ gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() }),
};

vi.mock("@/lib/sounds/graph", () => ({
  getAudioGraph: () => ({ context, input: {}, reverb: {} }),
}));

const clip = { duration: 1.2 } as AudioBuffer;
const options = { volume: 1, delayMs: 0 };

/** Lets the promises of `speak` settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("hush", () => {
  beforeEach(() => {
    sources.length = 0;
    hush();
  });

  it("stops the phrase being said", async () => {
    speak(Promise.resolve(clip), options);
    await settle();
    expect(sources).toHaveLength(1);
    expect(sources[0].start).toHaveBeenCalledOnce();

    hush();
    expect(sources[0].stop).toHaveBeenCalledOnce();
  });

  it("drops a phrase still on its way", async () => {
    let arrive!: (buffer: AudioBuffer) => void;
    speak(new Promise((resolve) => (arrive = resolve)), options);
    hush();
    arrive(clip);
    await settle();
    expect(sources).toHaveLength(0);
  });

  it("lets the phrases asked for afterwards speak", async () => {
    hush();
    speak(Promise.resolve(clip), options);
    await settle();
    expect(sources).toHaveLength(1);
    expect(sources[0].start).toHaveBeenCalledOnce();
  });

  it("forgets the queue: the next phrase starts right away", async () => {
    speak(Promise.resolve(clip), options);
    await settle();
    hush();
    speak(Promise.resolve(clip), options);
    await settle();
    expect(sources[1].start).toHaveBeenCalledWith(0);
  });
});
