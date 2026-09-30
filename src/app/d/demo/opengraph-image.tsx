import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND_COLORS, LOGO_PULSE_PATH } from "@/lib/brand";
import { PRESET_ACCENTS } from "@/lib/display/accents";
import { siteConfig } from "@/lib/site";

/*
 * The card of a shared demo link (X also takes it as its image). It shows what the demo does, a
 * sale landing on the wall, and says the data is simulated, like the demo itself.
 */

export const alt = `${siteConfig.name} live demo: a sale lands on a wall display, with simulated data`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const { glow: GLOW, screen: SCREEN, ink: INK, tile: TILE } = BRAND_COLORS;
/** The wall's inks and moment card on its dark theme (`wall-palette.css`, `d/display.css`). */
const GLOW_INK = PRESET_ACCENTS.emerald.dark.ink;
const INK_2 = "#a8adb5";
const CARD = "#0c0e11";

/** `#rrggbb` with an opacity, as `#rrggbbaa`. */
function withOpacity(color: string, opacity: number): string {
  return `${color}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

export default async function DemoOpenGraphImage() {
  const fontsDirectory = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");
  const [semiBold, regular] = await Promise.all([
    readFile(join(fontsDirectory, "Geist-SemiBold.ttf")),
    readFile(join(fontsDirectory, "Geist-Regular.ttf")),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: `radial-gradient(55% 75% at 78% 58%, ${withOpacity(GLOW, 0.22)}, ${SCREEN} 72%)`,
        color: INK,
        fontFamily: "Geist",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34 }}>
          <svg width="52" height="52" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="16" fill={TILE} stroke="#2a2d33" strokeWidth="2" />
            <path
              d={LOGO_PULSE_PATH}
              fill="none"
              stroke={GLOW}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {siteConfig.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 24px",
            borderRadius: 999,
            border: `2px solid ${withOpacity(INK, 0.12)}`,
            background: withOpacity(INK, 0.04),
            fontSize: 26,
            color: INK_2,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 999, background: GLOW }} />
          Live demo · simulated data
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 92,
              fontWeight: 600,
              letterSpacing: -3.5,
              lineHeight: 1.02,
            }}
          >
            <span>Hear a sale</span>
            <span style={{ color: GLOW }}>land.</span>
          </div>
          <span style={{ fontSize: 30, color: INK_2, maxWidth: 520, lineHeight: 1.35 }}>
            A wall display for your Stripe revenue, running on a fictional SaaS.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            width: 470,
            padding: "52px 40px 48px",
            borderRadius: 44,
            background: CARD,
            border: `2px solid ${withOpacity(INK, 0.11)}`,
            boxShadow: `0 0 120px -10px ${withOpacity(GLOW, 0.4)}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 32 }}>
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke={GLOW_INK}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Lucide's "sparkles", the icon of a new subscriber on screens. */}
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              <path d="M20 3v4" />
              <path d="M22 5h-4" />
              <path d="M4 17v2" />
              <path d="M5 18H3" />
            </svg>
            <span style={{ color: GLOW_INK }}>New subscriber</span>
          </div>
          <span style={{ fontSize: 124, fontWeight: 600, letterSpacing: -5, lineHeight: 1 }}>
            $199
          </span>
          <span style={{ fontSize: 28, color: INK_2 }}>Team · Netherlands</span>
          <span
            style={{
              marginTop: 10,
              padding: "10px 30px",
              borderRadius: 999,
              background: withOpacity(GLOW, 0.14),
              color: GLOW_INK,
              fontSize: 28,
            }}
          >
            +$199 MRR
          </span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist", data: semiBold, weight: 600, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
