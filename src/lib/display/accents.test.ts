import { describe, expect, it } from "vitest";
import { ACCENT_PALETTES, accentVariables } from "@/lib/display/accents";
import { ACCENTS } from "@/lib/screens/settings";

const HEX = /^#[0-9a-f]{6}$/;

/** WCAG relative luminance, to check accents stay visible on the near-black background. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("accent palettes", () => {
  it.each(ACCENTS)("defines a complete palette for %s", (accent) => {
    const palette = ACCENT_PALETTES[accent];
    for (const color of [palette.base, palette.bright, palette.deep, ...palette.confetti]) {
      expect(color).toMatch(HEX);
    }
    expect(palette.confetti.length).toBeGreaterThanOrEqual(3);
    expect(Object.values(accentVariables(accent))).toEqual([
      palette.base,
      palette.bright,
      palette.deep,
    ]);
  });

  it.each(ACCENTS)("keeps %s readable on the display background", (accent) => {
    const background = luminance("#08090b");
    const contrast = (luminance(ACCENT_PALETTES[accent].base) + 0.05) / (background + 0.05);
    expect(contrast).toBeGreaterThan(7);
  });
});
