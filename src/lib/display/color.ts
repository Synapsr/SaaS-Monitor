/**
 * Color math for accents: hex colors in and out, OKLCH in between. OKLCH changes lightness
 * without shifting the hue the eye sees, which lets a founder's color be made darker or lighter
 * until it reads well on a screen, and still look like theirs. Formulas by Björn Ottosson
 * (https://bottosson.github.io/posts/oklab/).
 */

/** A color in OKLCH: lightness 0–1, chroma from 0 (gray) up, hue in degrees. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

type Rgb = readonly [number, number, number];

const mapRgb = (rgb: Rgb, map: (channel: number, index: number) => number): Rgb => [
  map(rgb[0], 0),
  map(rgb[1], 1),
  map(rgb[2], 2),
];

/** sRGB channels (0–1) of `#rrggbb`. */
function parseHex(hex: string): Rgb {
  const channel = (index: number) => parseInt(hex.slice(index, index + 2), 16) / 255;
  return [channel(1), channel(3), channel(5)];
}

function toHex(rgb: Rgb): string {
  return `#${rgb
    .map((channel) =>
      Math.round(Math.min(1, Math.max(0, channel)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const toGamma = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = mapRgb(parseHex(hex), toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const hue = (Math.atan2(bAxis, a) * 180) / Math.PI;
  return { l: lightness, c: Math.hypot(a, bAxis), h: hue < 0 ? hue + 360 : hue };
}

/** Linear sRGB channels of an OKLCH color, possibly outside 0–1 when it is out of gamut. */
function oklchToLinear({ l: lightness, c, h }: Oklch): Rgb {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb: Rgb) => rgb.every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4);

/**
 * The hex color closest to `color` that screens can show: out of gamut, the chroma is reduced
 * until it fits, which keeps the lightness and the hue.
 */
export function oklchToHex(color: Oklch): string {
  const l = Math.min(1, Math.max(0, color.l));
  let linear = oklchToLinear({ ...color, l });
  if (!inGamut(linear)) {
    let low = 0;
    let high = color.c;
    for (let step = 0; step < 24; step += 1) {
      const c = (low + high) / 2;
      if (inGamut(oklchToLinear({ l, c, h: color.h }))) low = c;
      else high = c;
    }
    linear = oklchToLinear({ l, c: low, h: color.h });
  }
  return toHex(mapRgb(linear, toGamma));
}

/** WCAG relative luminance of `#rrggbb`. */
export function luminance(hex: string): number {
  const [r, g, b] = mapRgb(parseHex(hex), toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two colors, from 1 (same) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** `color` over `background` at `amount` (0–1) opacity, like `color-mix()` in sRGB. */
export function mixHex(color: string, background: string, amount: number): string {
  const under = parseHex(background);
  return toHex(
    mapRgb(parseHex(color), (channel, index) => channel * amount + under[index] * (1 - amount)),
  );
}
