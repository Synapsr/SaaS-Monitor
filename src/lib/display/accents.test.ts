import { describe, expect, it } from "vitest";
import { BRAND_COLORS } from "@/lib/brand";
import {
  ACCENT_CONTRAST,
  accentPalette,
  accentSwatch,
  accentVariables,
  derivePalette,
  PRESET_ACCENTS,
  SCREEN_BACKGROUNDS,
  type AccentPalette,
} from "@/lib/display/accents";
import { contrastRatio, hexToOklch, mixHex } from "@/lib/display/color";
import { ACCENTS, THEMES, type Theme } from "@/lib/screens/settings";

const HEX = /^#[0-9a-f]{6}$/;

/** A palette keeps its contrast: its glow on the background, its ink on the accent's wash. */
function expectReadable(palette: AccentPalette, theme: Theme) {
  const background = SCREEN_BACKGROUNDS[theme];
  const wash = mixHex(palette.glow, background, 0.14);
  expect(contrastRatio(palette.glow, background)).toBeGreaterThanOrEqual(
    ACCENT_CONTRAST[theme].glow,
  );
  expect(contrastRatio(palette.ink, wash)).toBeGreaterThanOrEqual(ACCENT_CONTRAST[theme].ink);
}

const CUSTOM_COLORS = ["#ff6b35", "#1e3a8a", "#635bff", "#ffff00", "#000000", "#ffffff", "#e5e7eb"];

describe("preset accents", () => {
  it.each(ACCENTS)("define complete palettes for %s", (accent) => {
    for (const theme of THEMES) {
      const palette = PRESET_ACCENTS[accent][theme];
      for (const color of [palette.glow, palette.ink, palette.deep, ...palette.confetti]) {
        expect(color).toMatch(HEX);
      }
      expect(palette.confetti.length).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(ACCENTS)("keep %s readable on both themes", (accent) => {
    for (const theme of THEMES) expectReadable(PRESET_ACCENTS[accent][theme], theme);
  });

  it("give the brand its color", () => {
    expect(BRAND_COLORS.glow).toBe(PRESET_ACCENTS.emerald.dark.glow);
    expect(BRAND_COLORS.screen).toBe(SCREEN_BACKGROUNDS.dark);
  });
});

describe("custom accents", () => {
  it.each(CUSTOM_COLORS)("stay readable on both themes: %s", (color) => {
    for (const theme of THEMES) expectReadable(derivePalette(color, theme), theme);
  });

  it("keep a color that already reads well as it is", () => {
    expect(derivePalette("#ff6b35", "dark").glow).toBe("#ff6b35");
    expect(derivePalette("#635bff", "light").glow).toBe("#635bff");
  });

  it("only change the lightness of the others, so they still look like the color picked", () => {
    const picked = hexToOklch("#1e3a8a");
    const shown = hexToOklch(derivePalette("#1e3a8a", "dark").glow);
    expect(shown.l).toBeGreaterThan(picked.l);
    expect(shown.h).toBeCloseTo(picked.h, -1);
  });
});

describe("accentPalette", () => {
  it("uses the presets' palettes, and derives the others once", () => {
    expect(accentPalette("violet", "light")).toBe(PRESET_ACCENTS.violet.light);
    expect(accentPalette("#ff6b35", "light")).toEqual(derivePalette("#ff6b35", "light"));
    expect(accentPalette("#ff6b35", "light")).toBe(accentPalette("#ff6b35", "light"));
  });

  it("stands for an accent with its dark glow in the settings", () => {
    expect(accentSwatch("sky")).toBe(PRESET_ACCENTS.sky.dark.glow);
    expect(accentSwatch("#ff6b35")).toBe("#ff6b35");
  });

  it("exposes a palette as CSS variables", () => {
    const palette = PRESET_ACCENTS.rose.dark;
    expect(accentVariables(palette)).toEqual({
      "--glow": palette.glow,
      "--glow-ink": palette.ink,
      "--glow-deep": palette.deep,
    });
  });
});
