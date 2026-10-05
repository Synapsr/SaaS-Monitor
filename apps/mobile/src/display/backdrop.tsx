import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useDisplay } from "@/display/context";

/**
 * The atmosphere behind a screen: a soft glow of the accent at the top left, a deeper one at the
 * bottom right, and a vignette (the web's `Backdrop`).
 */
export function Backdrop() {
  const { palette } = useDisplay();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="backdropGlow" cx="17%" cy="10%" rx="45%" ry="55%">
            <Stop offset="0" stopColor={palette.glow} stopOpacity={0.11} />
            <Stop offset="1" stopColor={palette.glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="backdropDeep" cx="90%" cy="95%" rx="40%" ry="50%">
            <Stop offset="0" stopColor={palette.glowDeep} stopOpacity={0.08} />
            <Stop offset="1" stopColor={palette.glowDeep} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="backdropVignette" cx="50%" cy="50%" rx="75%" ry="75%">
            <Stop offset="0.55" stopColor={palette.screen} stopOpacity={0} />
            <Stop offset="1" stopColor={palette.theme === "dark" ? "#000000" : "#0c0e14"} stopOpacity={palette.theme === "dark" ? 0.4 : 0.05} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#backdropGlow)" />
        <Rect width="100%" height="100%" fill="url(#backdropDeep)" />
        <Rect width="100%" height="100%" fill="url(#backdropVignette)" />
      </Svg>
    </View>
  );
}
