import { useId } from "react";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * A soft glow of `color` fading out from the center to the edges of its box: the web's
 * `radial-gradient(closest-side, color-mix(…), transparent)`.
 */
export function RadialGlow({ color, opacity }: { color: string; opacity: number }) {
  const id = `glow${useId().replace(/[^a-z0-9]/gi, "")}`;
  return (
    <Svg width="100%" height="100%" pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
