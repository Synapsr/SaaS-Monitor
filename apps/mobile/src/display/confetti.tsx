import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import type { Celebration } from "@/contract/display/moments";

/** A burst for a payment, a shower for a milestone. */
const PIECES: Record<Celebration, number> = { payment: 36, milestone: 90 };

interface Piece {
  x: number;
  drift: number;
  delay: number;
  duration: number;
  spin: number;
  width: number;
  height: number;
  color: string;
}

function pieces(kind: Celebration, colors: readonly string[], width: number): Piece[] {
  return Array.from({ length: PIECES[kind] }, (_, index) => ({
    x: Math.random() * width,
    drift: (Math.random() - 0.5) * 160,
    delay: Math.random() * (kind === "milestone" ? 900 : 300),
    duration: 2200 + Math.random() * 1600,
    spin: (Math.random() - 0.5) * 1440,
    width: 6 + Math.random() * 5,
    height: 9 + Math.random() * 7,
    color: colors[index % colors.length],
  }));
}

/**
 * Confetti in the accent's colors, falling over the screen once (`key` it to fire again). Only
 * money coming in deserves it (`momentCelebration`), and never with reduced motion.
 */
export function Confetti({ kind, colors }: { kind: Celebration; colors: readonly string[] }) {
  const { width, height } = useWindowDimensions();
  const burst = useMemo(() => pieces(kind, colors, width), [kind, colors, width]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {burst.map((piece, index) => (
        <ConfettiPiece key={index} piece={piece} fall={height + 60} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, fall }: { piece: Piece; fall: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.in(Easing.quad) }));
  }, [piece, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
    transform: [
      { translateX: piece.x + piece.drift * progress.value },
      { translateY: -40 + fall * progress.value },
      { rotate: `${piece.spin * progress.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        { position: "absolute", left: 0, top: 0, width: piece.width, height: piece.height, borderRadius: 2, backgroundColor: piece.color },
        style,
      ]}
    />
  );
}
