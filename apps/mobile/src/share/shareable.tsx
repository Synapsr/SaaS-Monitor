import * as Haptics from "expo-haptics";
import { createContext, use, useEffect, useRef, type ReactNode } from "react";
import { Pressable, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import type { ShareSubject } from "@/share/subjects";

/** As long as the system's context menus: long enough to scroll past without sharing. */
const HOLD_MS = 450;
/** A touch that turns into a scroll never shrinks what it started on. */
const PRESS_DELAY_MS = 110;
/** A finger that moves this far reads the chart rather than holding it. */
const HOLD_SLOP = 10;

/** Opens the share sheet on a subject. Only a screen of the app provides it: not the demo. */
export const ShareContext = createContext<((subject: ShareSubject) => void) | null>(null);

/** Shares a subject with the haptic of a long press; `null` where nothing can be shared. */
export function useShare(): ((subject: ShareSubject) => void) | null {
  const share = use(ShareContext);
  if (!share) return null;
  return (subject) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    share(subject);
  };
}

interface ShareableProps {
  subject: ShareSubject;
  /** Its place in a row or a column, like a tile's share of a row, or the wall's chart. */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * A part of a screen that touch and hold shares as an image: it sinks slightly while held, like
 * what opens a context menu. Laid out the same where nothing can be shared.
 */
export function Shareable({ subject, style, children }: ShareableProps) {
  const share = useShare();
  const held = useSharedValue(0);
  const sink = useAnimatedStyle(() => ({ transform: [{ scale: 1 - held.value * 0.025 }] }));
  return (
    <Pressable
      // Its content speaks for itself: screen readers share from the top bar's button.
      accessible={false}
      disabled={!share}
      unstable_pressDelay={PRESS_DELAY_MS}
      delayLongPress={HOLD_MS - PRESS_DELAY_MS}
      onPressIn={() => {
        held.value = withTiming(1, { duration: HOLD_MS - PRESS_DELAY_MS });
      }}
      onPressOut={() => {
        held.value = withSpring(0, { damping: 14, stiffness: 260 });
      }}
      onLongPress={() => share?.(subject)}
      style={style}
    >
      {/* Fills the room it is given, and only shrinks below its content on a wall that must fit. */}
      <Animated.View style={[{ flexGrow: 1, flexShrink: 1, minHeight: 0 }, sink]}>{children}</Animated.View>
    </Pressable>
  );
}

/**
 * For a view that handles its own touches, like the chart's crosshair: a finger held still shares
 * it, one that moves goes on reading it.
 */
export function useHoldToShare(subject: ShareSubject, onHeld: () => void) {
  const share = useShare();
  const hold = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const release = () => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  };
  useEffect(() => release, []);

  return {
    start(event: GestureResponderEvent) {
      release();
      if (!share) return;
      const { pageX, pageY } = event.nativeEvent;
      hold.current = {
        x: pageX,
        y: pageY,
        timer: setTimeout(() => {
          hold.current = null;
          onHeld();
          share(subject);
        }, HOLD_MS),
      };
    },
    move(event: GestureResponderEvent) {
      const start = hold.current;
      if (start && Math.hypot(event.nativeEvent.pageX - start.x, event.nativeEvent.pageY - start.y) > HOLD_SLOP) release();
    },
    release,
  };
}
