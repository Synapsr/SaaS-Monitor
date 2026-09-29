import { describe, expect, it } from "vitest";
import { contrastRatio, hexToOklch, luminance, mixHex, oklchToHex } from "./color";

describe("OKLCH", () => {
  it("reads hex colors like CSS does", () => {
    // `oklch(77.3% 0.153 163.2)` in CSS.
    const emerald = hexToOklch("#34d399");
    expect(emerald.l).toBeCloseTo(0.773, 3);
    expect(emerald.c).toBeCloseTo(0.153, 3);
    expect(emerald.h).toBeCloseTo(163.2, 1);
    expect(hexToOklch("#ffffff").l).toBeCloseTo(1, 3);
    expect(hexToOklch("#000000").l).toBeCloseTo(0, 3);
  });

  it("writes back the colors it reads", () => {
    for (const hex of ["#34d399", "#ff6b35", "#1e3a8a", "#635bff", "#808080", "#ffff00"]) {
      expect(oklchToHex(hexToOklch(hex)), hex).toBe(hex);
    }
  });

  it("brings colors screens cannot show into gamut, keeping their lightness and hue", () => {
    const vivid = { l: 0.7, c: 0.4, h: 150 };
    const shown = hexToOklch(oklchToHex(vivid));
    expect(shown.l).toBeCloseTo(0.7, 2);
    expect(shown.h).toBeCloseTo(150, 0);
    expect(shown.c).toBeLessThan(0.4);
  });
});

describe("contrast", () => {
  it("follows WCAG", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it("mixes a color over a background", () => {
    expect(mixHex("#ffffff", "#000000", 0.5)).toBe("#808080");
    expect(mixHex("#34d399", "#08090b", 0)).toBe("#08090b");
    expect(mixHex("#34d399", "#08090b", 1)).toBe("#34d399");
  });
});
