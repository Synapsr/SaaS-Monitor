import { contrastRatio, hexToOklch, mixHex, oklchToHex, type Oklch } from "@/lib/display/color";
import { isCustomAccent, type Accent, type PresetAccent, type Theme } from "@/lib/screens/settings";

/** The colors a screen draws its accent with, on one theme. */
export interface AccentPalette {
  /** The accent itself: chart line, progress, live dot. Stands out from the background. */
  glow: string;
  /** Accent text and small marks: readable on the background and on the accent's wash. */
  ink: string;
  /** A deeper shade, for the far end of gradients. */
  deep: string;
  /** Confetti colors (hex: canvas-confetti only parses hex). */
  confetti: readonly string[];
}

/** Background of each theme, which accents must stand out from (`wall-palette.css`). */
export const SCREEN_BACKGROUNDS: Record<Theme, string> = { dark: "#08090b", light: "#f4f5f7" };

/**
 * Contrast every palette keeps with its background: WCAG's 3:1 for graphics and 4.5:1 for text,
 * and much more on the dark screen, where the accent is meant to glow.
 */
export const ACCENT_CONTRAST: Record<Theme, { glow: number; ink: number }> = {
  dark: { glow: 7, ink: 7 },
  light: { glow: 3, ink: 4.5 },
};

/** How much of the accent tints its wash (`--glow-wash` in `display.css`), behind accent text. */
const WASH_AMOUNT = 0.14;

/** A preset's palettes are tuned by hand, within the contrast every palette keeps. */
interface Preset extends Record<Theme, AccentPalette> {
  /** Name shown in the screen settings. */
  label: string;
}

export const PRESET_ACCENTS: Record<PresetAccent, Preset> = {
  emerald: {
    label: "Emerald",
    dark: {
      glow: "#34d399",
      ink: "#6ee7b7",
      deep: "#059669",
      confetti: ["#34d399", "#6ee7b7", "#a7f3d0", "#10b981", "#f0fdf4"],
    },
    light: {
      glow: "#059669",
      ink: "#065f46",
      deep: "#047857",
      confetti: ["#10b981", "#34d399", "#059669", "#047857", "#6ee7b7"],
    },
  },
  violet: {
    label: "Violet",
    dark: {
      glow: "#a78bfa",
      ink: "#c4b5fd",
      deep: "#7c3aed",
      confetti: ["#a78bfa", "#c4b5fd", "#ddd6fe", "#8b5cf6", "#f5f3ff"],
    },
    light: {
      glow: "#8b5cf6",
      ink: "#6d28d9",
      deep: "#7c3aed",
      confetti: ["#8b5cf6", "#a78bfa", "#7c3aed", "#6d28d9", "#c4b5fd"],
    },
  },
  sky: {
    label: "Sky",
    dark: {
      glow: "#38bdf8",
      ink: "#7dd3fc",
      deep: "#0284c7",
      confetti: ["#38bdf8", "#7dd3fc", "#bae6fd", "#0ea5e9", "#f0f9ff"],
    },
    light: {
      glow: "#0284c7",
      ink: "#0369a1",
      deep: "#075985",
      confetti: ["#0ea5e9", "#38bdf8", "#0284c7", "#0369a1", "#7dd3fc"],
    },
  },
  amber: {
    label: "Amber",
    dark: {
      glow: "#fbbf24",
      ink: "#fcd34d",
      deep: "#d97706",
      confetti: ["#fbbf24", "#fcd34d", "#fde68a", "#f59e0b", "#fffbeb"],
    },
    light: {
      glow: "#d57400",
      ink: "#92400e",
      deep: "#b45309",
      confetti: ["#f59e0b", "#fbbf24", "#d97706", "#b45309", "#fcd34d"],
    },
  },
  rose: {
    label: "Rose",
    dark: {
      glow: "#fb7185",
      ink: "#fda4af",
      deep: "#e11d48",
      confetti: ["#fb7185", "#fda4af", "#fecdd3", "#f43f5e", "#fff1f2"],
    },
    light: {
      glow: "#f43f5e",
      ink: "#be123c",
      deep: "#e11d48",
      confetti: ["#f43f5e", "#fb7185", "#e11d48", "#be123c", "#fda4af"],
    },
  },
};

/** The color that stands for an accent in the settings: its glow on the dark screen. */
export function accentSwatch(accent: Accent): string {
  return isCustomAccent(accent) ? accent : PRESET_ACCENTS[accent].dark.glow;
}

/**
 * Moves `color` darker (`step` < 0) or lighter until it contrasts enough with `background`. The
 * hue and the chroma stay, so the color still looks like the one picked.
 */
function withContrast(color: Oklch, background: string, ratio: number, step: number): Oklch {
  let adjusted = color;
  while (contrastRatio(oklchToHex(adjusted), background) < ratio) {
    const l = adjusted.l + step;
    if (l < 0 || l > 1) break;
    adjusted = { ...adjusted, l };
  }
  return adjusted;
}

const shade = (color: Oklch, lightness: number, chroma = 1): Oklch => ({
  ...color,
  l: Math.min(1, Math.max(0, color.l + lightness)),
  c: color.c * chroma,
});

/**
 * The palette of a custom color: made lighter on the dark screen, or darker on the light one,
 * only as much as its contrast needs. Shades follow the steps of the presets.
 */
export function derivePalette(seed: string, theme: Theme): AccentPalette {
  const background = SCREEN_BACKGROUNDS[theme];
  const contrast = ACCENT_CONTRAST[theme];
  const direction = theme === "dark" ? 1 : -1;
  const glow = withContrast(hexToOklch(seed), background, contrast.glow, 0.01 * direction);
  const glowHex = oklchToHex(glow);
  const wash = mixHex(glowHex, background, WASH_AMOUNT);
  // The ink starts a step past the glow, towards more contrast: lighter text on the dark screen.
  const ink = withContrast(
    shade(glow, 0.08 * direction, 0.85),
    wash,
    contrast.ink,
    0.01 * direction,
  );
  const deep = shade(glow, theme === "dark" ? -0.17 : -0.08, 0.9);
  const inkHex = oklchToHex(ink);
  return {
    glow: glowHex,
    ink: inkHex,
    deep: oklchToHex(deep),
    // A light sparkle over the dark screen, a bolder one over the light screen.
    confetti: [
      glowHex,
      inkHex,
      oklchToHex(shade(glow, 0.1, 0.6)),
      oklchToHex(deep),
      oklchToHex(
        theme === "dark" ? { ...glow, l: 0.97, c: Math.min(glow.c, 0.02) } : shade(glow, -0.2),
      ),
    ],
  };
}

const derived = new Map<string, AccentPalette>();

/** The palette of a screen's accent on its theme. */
export function accentPalette(accent: Accent, theme: Theme): AccentPalette {
  if (!isCustomAccent(accent)) return PRESET_ACCENTS[accent][theme];
  const key = `${accent}:${theme}`;
  let palette = derived.get(key);
  if (!palette) {
    palette = derivePalette(accent, theme);
    derived.set(key, palette);
  }
  return palette;
}

/** CSS custom properties exposing an accent to the display: `--glow`, the one glowing color. */
export function accentVariables(palette: AccentPalette): Record<`--${string}`, string> {
  return { "--glow": palette.glow, "--glow-ink": palette.ink, "--glow-deep": palette.deep };
}
