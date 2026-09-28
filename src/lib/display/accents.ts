import type { Accent } from "@/lib/screens/settings";

export interface AccentPalette {
  /** The glowing color: chart line, progress, live dot. Readable on the dark background. */
  base: string;
  /** Lighter tint for highlights and accent text. */
  bright: string;
  /** Deeper shade, for the far end of gradients. */
  deep: string;
  /** Confetti colors (hex: canvas-confetti only parses hex), with a near-white sparkle. */
  confetti: readonly string[];
}

/** One small palette per accent, tuned for a near-black screen. */
export const ACCENT_PALETTES: Record<Accent, AccentPalette> = {
  emerald: {
    base: "#34d399",
    bright: "#6ee7b7",
    deep: "#059669",
    confetti: ["#34d399", "#6ee7b7", "#a7f3d0", "#10b981", "#f0fdf4"],
  },
  violet: {
    base: "#a78bfa",
    bright: "#c4b5fd",
    deep: "#7c3aed",
    confetti: ["#a78bfa", "#c4b5fd", "#ddd6fe", "#8b5cf6", "#f5f3ff"],
  },
  sky: {
    base: "#38bdf8",
    bright: "#7dd3fc",
    deep: "#0284c7",
    confetti: ["#38bdf8", "#7dd3fc", "#bae6fd", "#0ea5e9", "#f0f9ff"],
  },
  amber: {
    base: "#fbbf24",
    bright: "#fcd34d",
    deep: "#d97706",
    confetti: ["#fbbf24", "#fcd34d", "#fde68a", "#f59e0b", "#fffbeb"],
  },
  rose: {
    base: "#fb7185",
    bright: "#fda4af",
    deep: "#e11d48",
    confetti: ["#fb7185", "#fda4af", "#fecdd3", "#f43f5e", "#fff1f2"],
  },
};

/** CSS custom properties exposing an accent to the display: `--glow`, the one glowing color. */
export function accentVariables(accent: Accent): Record<`--${string}`, string> {
  const palette = ACCENT_PALETTES[accent];
  return {
    "--glow": palette.base,
    "--glow-bright": palette.bright,
    "--glow-deep": palette.deep,
  };
}
