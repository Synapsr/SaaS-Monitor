import { accentPalette, SCREEN_BACKGROUNDS } from "@/contract/display/accents";
import type { Accent, Theme } from "@/contract/screens/settings";

/**
 * The colors of a screen, as the web's `wall-palette.css` and `d/display.css` define them for
 * each theme, with the screen's accent (`accentPalette`, which keeps custom colors readable).
 */
export interface DisplayPalette {
  theme: Theme;
  screen: string;
  ink: string;
  ink2: string;
  ink3: string;
  surface: string;
  hairline: string;
  fill: string;
  card: string;
  popover: string;
  edge: string;
  scrim: string;
  scrimEdge: string;
  vignette: string;
  warn: string;
  warnInk: string;
  glow: string;
  glowInk: string;
  glowDeep: string;
  /** The accent at 14% over the background: badges and chips of good news. */
  glowWash: string;
  confetti: readonly string[];
}

type Neutrals = Omit<DisplayPalette, "theme" | "glow" | "glowInk" | "glowDeep" | "glowWash" | "confetti">;

const NEUTRALS: Record<Theme, Neutrals> = {
  dark: {
    screen: SCREEN_BACKGROUNDS.dark,
    ink: "#f4f5f7",
    ink2: "#a8adb5",
    ink3: "#80858e",
    surface: "rgba(255, 255, 255, 0.028)",
    hairline: "rgba(255, 255, 255, 0.075)",
    fill: "rgba(255, 255, 255, 0.06)",
    card: "#0c0e11",
    popover: "#121418",
    edge: "rgba(255, 255, 255, 0.11)",
    scrim: "rgba(0, 0, 0, 0.55)",
    scrimEdge: "rgba(0, 0, 0, 0.3)",
    vignette: "rgba(0, 0, 0, 0.4)",
    warn: "#fcd34d",
    warnInk: "#fde68a",
  },
  // Cards are white on the light screen: surfaces rise above it instead of glowing.
  light: {
    screen: SCREEN_BACKGROUNDS.light,
    ink: "#0b0d10",
    ink2: "#4a505a",
    ink3: "#646b76",
    surface: "rgba(255, 255, 255, 0.72)",
    hairline: "rgba(12, 14, 20, 0.08)",
    fill: "rgba(12, 14, 20, 0.05)",
    card: "#ffffff",
    popover: "#ffffff",
    edge: "rgba(12, 14, 20, 0.1)",
    scrim: "rgba(244, 245, 247, 0.78)",
    scrimEdge: "rgba(244, 245, 247, 0.5)",
    vignette: "rgba(12, 14, 20, 0.05)",
    warn: "#f59e0b",
    warnInk: "#b45309",
  },
};

/** `#rrggbb` at `alpha` opacity, for React Native's colors. */
export function withAlpha(hex: string, alpha: number): string {
  const channel = (index: number) => parseInt(hex.slice(index, index + 2), 16);
  return `rgba(${channel(1)}, ${channel(3)}, ${channel(5)}, ${alpha})`;
}

const palettes = new Map<string, DisplayPalette>();

/** The same object for the same theme and accent, so that it can be a memo dependency. */
export function displayPalette(theme: Theme, accent: Accent): DisplayPalette {
  const id = `${theme}:${accent}`;
  let palette = palettes.get(id);
  if (!palette) {
    const colors = accentPalette(accent, theme);
    palette = {
      theme,
      ...NEUTRALS[theme],
      glow: colors.glow,
      glowInk: colors.ink,
      glowDeep: colors.deep,
      glowWash: withAlpha(colors.glow, 0.14),
      confetti: colors.confetti,
    };
    palettes.set(id, palette);
  }
  return palette;
}
