import type { DisplayLayout } from "@/display/context";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * How much larger than a phone's a screen is drawn. Portrait follows the width (a phone is 1, a
 * tablet up to 1.5); the wall layout must fit its height and width at once, like the web's
 * 16:9 frame.
 */
export function displayScale(layout: DisplayLayout, width: number, height: number): number {
  if (layout === "wall") return clamp(Math.min(height / 400, width / 860), 0.85, 2.4);
  return clamp(width / 390, 1, 1.5);
}

/** Landscape is the wall layout, "TV mode". */
export function displayLayout(width: number, height: number): DisplayLayout {
  return width > height ? "wall" : "phone";
}
