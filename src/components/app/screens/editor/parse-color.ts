import type { CustomAccent } from "@/lib/screens/settings";

/**
 * Reads a color typed or pasted by hand: "#FF6B35", "ff6b35", or the short "#f63" → "#ff6633".
 * `null` when it isn't a hex color. Brand guides and design tools all hand out hex.
 */
export function parseColor(input: string): CustomAccent | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!match) return null;
  const digits = match[1].toLowerCase();
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;
  return `#${full}`;
}
