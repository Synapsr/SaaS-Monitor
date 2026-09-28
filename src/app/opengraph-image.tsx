import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GLOW = "#34d399";
const SPARKLINE = "M0 150 C60 146 90 132 140 128 S220 110 270 100 S350 90 390 70 S470 40 560 22";

export default async function OpenGraphImage() {
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
        padding: 72,
        background: "radial-gradient(60% 70% at 85% 100%, rgba(52,211,153,0.28), #08090b 70%)",
        color: "#f4f5f7",
        fontFamily: "Geist",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34 }}>
        <svg width="52" height="52" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="16" fill="#0a0a0a" stroke="#2a2d33" strokeWidth="2" />
          <path
            d="M12 40h9l6-16 8 24 6-14h11"
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
            flexDirection: "column",
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: -3,
            lineHeight: 1.05,
          }}
        >
          <span>Your MRR,</span>
          <span style={{ display: "flex", gap: 22 }}>
            <span style={{ color: GLOW }}>live</span>
            <span>on the wall.</span>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 88, fontWeight: 600, letterSpacing: -3 }}>$14,880</span>
          <span style={{ fontSize: 28, color: GLOW, fontWeight: 400 }}>+19% in 30 days</span>
          <svg width="360" height="100" viewBox="0 0 560 160" style={{ marginTop: 16 }}>
            <path d={SPARKLINE} fill="none" stroke={GLOW} strokeWidth="7" strokeLinecap="round" />
          </svg>
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
