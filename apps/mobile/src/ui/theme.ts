import { DarkTheme, type Theme } from "expo-router";

/**
 * The app's colors: the wall display's dark palette (near-black, quiet inks) and its emerald,
 * the brand's accent. Screens wear their own theme and accent over it.
 */
export const colors = {
  background: "#08090b",
  surface: "#111317",
  surfaceRaised: "#171a1f",
  hairline: "rgba(255, 255, 255, 0.08)",
  fill: "rgba(255, 255, 255, 0.06)",
  ink: "#f4f5f7",
  ink2: "#a8adb5",
  ink3: "#80858e",
  accent: "#34d399",
  accentInk: "#6ee7b7",
  accentWash: "rgba(52, 211, 153, 0.14)",
  /** Text and icons on the accent. */
  onAccent: "#03140d",
  danger: "#fb7185",
  warn: "#fcd34d",
} as const;

export const radius = { small: 10, medium: 16, large: 22 } as const;

/** Navigation chrome (headers, sheets) in the app's colors. */
export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.ink,
    border: colors.hairline,
    notification: colors.accent,
  },
};
