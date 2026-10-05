import { useEffect, type ReactNode } from "react";
import { Platform, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { TOTAL } from "@/contract/display/rotation";
import { formatClock } from "@/contract/display/time";
import type { DisplayAccount } from "@/contract/display/types";
import { useDisplay } from "@/display/context";
import { DisplayText } from "@/display/text";
import { useNow } from "@/display/use-now";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { LogoPulse } from "@/ui/icons";

/** Where a screen rotating between its accounts stands. */
export interface RotationStatus {
  slides: readonly string[];
  slide: string;
  /** Changes with every turn, restarted ones included. */
  turn: number;
  seconds: number;
  /** A moment holds the slide on screen. */
  paused: boolean;
}

interface TopBarProps {
  name: string;
  accounts: DisplayAccount[];
  /** Several combined accounts are named, once their data shows. */
  showAccounts: boolean;
  rotation: RotationStatus | null;
  online: boolean;
  timeZone: string;
  /** Buttons of the app around the screen's name: back, and the screen's settings. */
  leading?: ReactNode;
  trailing?: ReactNode;
}

/** The screen's name, its accounts, whether it is live, and the time where the screen is. */
export function TopBar({ name, accounts, showAccounts, rotation, online, timeZone, leading, trailing }: TopBarProps) {
  const { locale, scale, layout } = useDisplay();
  const { text } = locale;
  const wall = layout === "wall";
  const testMode = accounts.some((account) => !account.livemode);
  const pills = showAccounts && (rotation !== null || accounts.length > 1);

  return (
    <View style={{ gap: 10 * scale }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 * scale, minHeight: 32 * scale }}>
        {leading}
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 * scale }}>
          {wall && <Pulse />}
          <DisplayText size={wall ? 15 : 17} weight={wall ? "500" : "600"} tracking={-0.01} numberOfLines={1} style={{ flexShrink: 1 }}>
            {name}
          </DisplayText>
          {wall && pills && <AccountPills accounts={accounts} rotation={rotation} />}
          {testMode && <TestBadge label={text.topBar.testData} />}
        </View>
        <LiveIndicator online={online} label={online ? text.topBar.live : text.topBar.reconnecting} />
        {wall && <Clock timeZone={timeZone} />}
        {trailing}
      </View>
      {!wall && pills && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 * scale }}>
          <AccountPills accounts={accounts} rotation={rotation} />
        </ScrollView>
      )}
    </View>
  );
}

function Pulse() {
  const { palette, scale } = useDisplay();
  return <LogoPulse height={14 * scale} color={palette.glow} />;
}

function TestBadge({ label }: { label: string }) {
  const { palette, scale } = useDisplay();
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 9 * scale,
        paddingVertical: 2 * scale,
        borderWidth: 1,
        borderColor: palette.warnInk,
        opacity: 0.85,
      }}
    >
      <DisplayText size={11} tone="warnInk" numberOfLines={1}>
        {label}
      </DisplayText>
    </View>
  );
}

/** The accounts of the screen; on a rotation, the one on screen lit and filling up to the next. */
function AccountPills({ accounts, rotation }: { accounts: DisplayAccount[]; rotation: RotationStatus | null }) {
  const { locale, palette, scale } = useDisplay();
  const slides = rotation?.slides ?? accounts.map((account) => account.id);
  return (
    <View style={{ flexDirection: "row", gap: 6 * scale, flexShrink: 1, overflow: "hidden" }}>
      {slides.map((slide) => {
        const account = accounts.find(({ id }) => id === slide);
        const active = rotation?.slide === slide;
        const name = slide === TOTAL ? locale.text.allAccounts : (account?.name ?? "");
        return (
          <View
            key={slide}
            accessibilityState={{ selected: active }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6 * scale,
              overflow: "hidden",
              borderRadius: 999,
              paddingHorizontal: 10 * scale,
              paddingVertical: 3 * scale,
              borderWidth: 1,
              borderColor: active ? palette.glowWash : palette.hairline,
              backgroundColor: active ? palette.glowWash : palette.surface,
            }}
          >
            {account && account.status !== "ready" && (
              <View
                style={{
                  width: 6 * scale,
                  height: 6 * scale,
                  borderRadius: 3 * scale,
                  backgroundColor: account.status === "error" ? palette.warn : palette.ink3,
                }}
              />
            )}
            <DisplayText size={11.5} weight={active ? "500" : "400"} tone={active ? "ink" : "ink3"} numberOfLines={1}>
              {name}
            </DisplayText>
            {active && rotation && !rotation.paused && <TurnProgress key={rotation.turn} seconds={rotation.seconds} />}
          </View>
        );
      })}
    </View>
  );
}

/** The time left before the next account, filling the bottom of the lit pill. */
function TurnProgress({ seconds }: { seconds: number }) {
  const { palette } = useDisplay();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: seconds * 1000, easing: Easing.linear });
  }, [progress, seconds]);
  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <Animated.View style={[{ position: "absolute", left: 0, bottom: 0, height: 2, backgroundColor: palette.glow }, style]} />
  );
}

function LiveIndicator({ online, label }: { online: boolean; label: string }) {
  const { palette, scale, layout } = useDisplay();
  const reducedMotion = useReducedMotion();
  const ping = useSharedValue(0);
  useEffect(() => {
    ping.value =
      online && !reducedMotion
        ? withRepeat(withTiming(1, { duration: 2600, easing: Easing.bezier(0, 0, 0.2, 1) }), -1, false)
        : 0;
  }, [online, reducedMotion, ping]);
  const ring = useAnimatedStyle(() => ({
    opacity: online && !reducedMotion ? 0.55 * (1 - Math.min(1, ping.value / 0.8)) : 0,
    transform: [{ scale: 1 + ping.value * 1.6 }],
  }));
  const dot = 8 * scale;
  const color = online ? palette.glow : palette.warn;
  return (
    <View accessible accessibilityLiveRegion="polite" accessibilityLabel={label} style={{ flexDirection: "row", alignItems: "center", gap: 7 * scale }}>
      <View style={{ width: dot, height: dot }}>
        <Animated.View style={[{ position: "absolute", width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }, ring]} />
        <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
      </View>
      <DisplayText size={layout === "wall" ? 12 : 13} tone={online ? "ink2" : "warnInk"} numberOfLines={1}>
        {label}
      </DisplayText>
    </View>
  );
}

/** The wall clock reads like the web's, in a monospace face. */
const MONOSPACE = Platform.select({ ios: "Menlo", default: "monospace" });

function Clock({ timeZone }: { timeZone: string }) {
  const { locale } = useDisplay().locale;
  const now = useNow(1_000);
  const { time, date } = formatClock(new Date(now), timeZone, locale);
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
      <DisplayText size={12} tone="ink3" numberOfLines={1}>
        {date}
      </DisplayText>
      <DisplayText size={15} weight="500" tabular style={{ fontFamily: MONOSPACE }}>
        {time}
      </DisplayText>
    </View>
  );
}
