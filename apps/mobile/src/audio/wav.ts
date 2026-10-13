/**
 * Gives a WAV file the sizes its header leaves unset: speech synthesized as a stream announces
 * a RIFF and a data chunk of 0xFFFFFFFF bytes, which some players take for hours of audio.
 * Returns the file itself when it is not such a WAV.
 */
export function completeWavHeader(file: Uint8Array): Uint8Array {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const text = (offset: number) => String.fromCharCode(...file.subarray(offset, offset + 4));
  if (file.byteLength < 12 || text(0) !== "RIFF" || text(8) !== "WAVE") return file;

  const fixed = file.slice();
  const fixedView = new DataView(fixed.buffer);
  fixedView.setUint32(4, file.byteLength - 8, true);
  // Chunks follow one another; the data chunk runs to the end of the file.
  for (let offset = 12; offset + 8 <= file.byteLength; ) {
    const size = view.getUint32(offset + 4, true);
    if (text(offset) === "data") {
      fixedView.setUint32(offset + 4, Math.min(size, file.byteLength - offset - 8), true);
      return fixed;
    }
    offset += 8 + size + (size % 2);
  }
  return file;
}
