import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import type { DisplayLayout } from "@/display/context";
import { displayLayout, displayScale } from "@/display/scale";
import { IconButton } from "@/ui/button";
import { ChevronLeftIcon, EllipsisIcon, type LucideIcon } from "@/ui/icons";

/** Controls of the wall layout fade away when nobody touches the screen. */
const CONTROLS_IDLE_MS = 5_000;

interface FrameButton {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

interface FrameControls {
  layout: DisplayLayout;
  scale: number;
  /** Back and settings buttons for the screen's top bar. */
  leading: ReactNode;
  trailing: ReactNode;
  /** Another button of the top bar, like them. */
  button: (button: FrameButton) => ReactNode;
}

interface ScreenFrameProps {
  theme: "dark" | "light";
  onBack: () => void;
  onSettings?: () => void;
  children: (controls: FrameControls) => ReactNode;
}

/**
 * What surrounds a screen in the app: the layout of the device's orientation (landscape is the
 * wall's "TV mode", kept awake and full screen), and the app's buttons, which fade away in TV mode
 * until the screen is touched.
 */
export function ScreenFrame({ theme, onBack, onSettings, children }: ScreenFrameProps) {
  const { width, height } = useWindowDimensions();
  const layout = displayLayout(width, height);
  const wall = layout === "wall";
  const scale = displayScale(layout, width, height);
  const [controlsVisible, setControlsVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const reveal = () => {
    setControlsVisible(true);
    clearTimeout(timer.current);
    if (wall) timer.current = setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS);
  };

  useEffect(() => {
    if (!wall) return;
    timer.current = setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS);
    // TV mode stays on, like the wall display.
    void activateKeepAwakeAsync("tv-mode");
    return () => {
      clearTimeout(timer.current);
      void deactivateKeepAwake("tv-mode");
    };
  }, [wall]);

  const ink = theme === "light" ? "#0b0d10" : "#f4f5f7";
  const fill = theme === "light" ? "rgba(12, 14, 20, 0.06)" : "rgba(255, 255, 255, 0.07)";
  const size = (wall ? 30 : 36) * Math.min(scale, 1.4);
  // Portrait always shows them: only TV mode is watched from afar.
  const visible = !wall || controlsVisible;
  const button = ({ icon, label, onPress }: FrameButton) => (
    <Fading visible={visible}>
      <IconButton icon={icon} label={label} color={ink} background={fill} size={size} onPress={onPress} />
    </Fading>
  );
  const leading = button({ icon: ChevronLeftIcon, label: "Back", onPress: onBack });
  const trailing = onSettings ? button({ icon: EllipsisIcon, label: "Screen settings", onPress: onSettings }) : null;

  return (
    <View style={{ flex: 1 }} onTouchStart={reveal}>
      <StatusBar hidden={wall} style={theme === "light" ? "dark" : "light"} animated />
      {children({ layout, scale, leading, trailing, button })}
    </View>
  );
}

function Fading({ visible, children }: { visible: boolean; children: ReactNode }) {
  const style = useAnimatedStyle(() => ({ opacity: withTiming(visible ? 1 : 0, { duration: 300 }) }));
  return (
    <Animated.View style={style} pointerEvents={visible ? "auto" : "none"}>
      {children}
    </Animated.View>
  );
}

