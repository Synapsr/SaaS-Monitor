import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND_COLORS, LOGO_PULSE_PATH } from "@/lib/brand";
import { siteConfig } from "@/lib/site";
import { formatDollars, formatPercent } from "@/lib/site/format";
import type { SiteText } from "@/lib/site/i18n";

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };

const { glow: GLOW, screen: SCREEN, ink: INK, tile: TILE } = BRAND_COLORS;
const SPARKLINE = "M0 150 C60 146 90 132 140 128 S220 110 270 100 S350 90 390 70 S470 40 560 22";

/** `#rrggbb` with an opacity, as `#rrggbbaa`. */
function withOpacity(color: string, opacity: number): string {
  return `${color}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

/**
 * The site's social preview, in a language: its promise, and the demo's MRR with its growth,
 * written as that language writes them.
 */
export async function socialImage(text: Pick<SiteText, "hero" | "meta">, locale: string) {
  const fontsDirectory = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");
  const [semiBold, regular] = await Promise.all([
    readFile(join(fontsDirectory, "Geist-SemiBold.ttf")),
    readFile(join(fontsDirectory, "Geist-Regular.ttf")),
  ]);
  const { start, highlight, end } = text.hero.title;
  const growth = text.meta.imageGrowth(formatPercent(0.187, locale, { signed: true }));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: `radial-gradient(60% 70% at 85% 100%, ${withOpacity(GLOW, 0.28)}, ${SCREEN} 70%)`,
        color: INK,
        fontFamily: "Geist",
      }}
    >
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

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            maxWidth: 620,
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: -3,
            lineHeight: 1.05,
          }}
        >
          {/* Satori lays words out one by one: the highlight keeps its color. */}
          {start.trim() && <span style={{ marginRight: 20 }}>{start.trim()}</span>}
          <span style={{ color: GLOW, marginRight: 20 }}>{highlight}</span>
          {end.trim() && <span>{end.trim()}</span>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 80, fontWeight: 600, letterSpacing: -3 }}>
            {formatDollars(14_880, locale)}
          </span>
          <span style={{ fontSize: 28, color: GLOW, fontWeight: 400 }}>{growth}</span>
          <svg width="360" height="100" viewBox="0 0 560 160" style={{ marginTop: 16 }}>
            <path d={SPARKLINE} fill="none" stroke={GLOW} strokeWidth="7" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>,
    {
      ...SOCIAL_IMAGE_SIZE,
      fonts: [
        { name: "Geist", data: semiBold, weight: 600, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
