import { completeWavHeader } from "@/audio/wav";

/** A mono 16-bit WAV of `samples` samples, with the sizes `riff` and `data` in its header. */
function wav(samples: number, sizes: { riff?: number; data?: number } = {}): Uint8Array {
  const file = new Uint8Array(44 + samples * 2);
  const view = new DataView(file.buffer);
  const write = (offset: number, text: string) =>
    [...text].forEach((character, index) => (file[offset + index] = character.charCodeAt(0)));
  write(0, "RIFF");
  view.setUint32(4, sizes.riff ?? 36 + samples * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 48_000, true);
  view.setUint32(28, 96_000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, sizes.data ?? samples * 2, true);
  return file;
}

const sizes = (file: Uint8Array) => {
  const view = new DataView(file.buffer, file.byteOffset);
  return { riff: view.getUint32(4, true), data: view.getUint32(40, true) };
};

describe("completeWavHeader", () => {
  it("gives a streamed WAV the sizes of its audio", () => {
    const streamed = wav(1_000, { riff: 0xffffffff, data: 0xffffffff });
    expect(sizes(completeWavHeader(streamed))).toEqual({ riff: 36 + 2_000, data: 2_000 });
    // The audio itself is untouched.
    expect(completeWavHeader(streamed).subarray(44)).toEqual(streamed.subarray(44));
  });

  it("leaves complete WAVs, and anything else, as they are", () => {
    const complete = wav(10);
    expect(sizes(completeWavHeader(complete))).toEqual({ riff: 56, data: 20 });
    const mp3 = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(completeWavHeader(mp3)).toBe(mp3);
  });
});
