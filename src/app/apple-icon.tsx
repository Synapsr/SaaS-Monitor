import { ImageResponse } from "next/og";
import { BRAND_COLORS, LOGO_PULSE_PATH } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * The icon of a screen added to an iPad's home screen (`docs/wall-display.md`): `icon.svg` on a
 * square tile, as iOS rounds the corners itself.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: BRAND_COLORS.tile }}>
      <svg width="180" height="180" viewBox="0 0 64 64">
        <path
          d={LOGO_PULSE_PATH}
          fill="none"
          stroke={BRAND_COLORS.glow}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    size,
  );
}
