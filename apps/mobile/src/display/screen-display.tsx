import { useState, type ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMomentAudio } from "@/audio/use-moment-audio";
import { momentPlays } from "@/contract/display/events";
import { recurringMetric } from "@/contract/display/metric";
import { goalProgress } from "@/contract/display/milestones";
import {
  isMrrIncrease,
  momentAccount,
  momentCelebration,
  momentSound,
  type Celebration,
  type Moment,
} from "@/contract/display/moments";
import { rotationSlides, screenView, TOTAL, type ScreenView } from "@/contract/display/rotation";
import type { DisplayState } from "@/contract/display/types";
import { Backdrop } from "@/display/backdrop";
import { Confetti } from "@/display/confetti";
import { DisplayProvider, useDisplay, type DisplayLayout } from "@/display/context";
import { GoalProgress } from "@/display/goal-progress";
import { playMomentHaptic } from "@/display/haptics";
import { Hero } from "@/display/hero";
import { KpiTiles } from "@/display/kpi-tiles";
import { LiveFeed } from "@/display/live-feed";
import { MomentOverlay } from "@/display/moment-overlay";
import { MrrChart } from "@/display/mrr-chart";
import { StateStatus } from "@/display/status-message";
import { TopBar, type RotationStatus } from "@/display/top-bar";
import { useMoments } from "@/display/use-moments";
import { useNow } from "@/display/use-now";
import { useRotation } from "@/display/use-rotation";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { ScreenAccess } from "@/screens/api";

export interface ScreenDisplayProps {
  state: DisplayState;
  /** `false` while polls fail: the last data stays on screen with a discreet indicator. */
  online: boolean;
  layout: DisplayLayout;
  scale: number;
  /** Buttons of the app in the top bar, around the screen's name. */
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Pull to refresh, in the portrait layout. */
  onRefresh?: () => Promise<void>;
  /** Under everything, in the portrait layout. */
  footer?: ReactNode;
  /**
   * Where the screen's sounds and voices come from, while it is on display: its moments play them
   * if this device asks for it. Without, the screen stays silent (the demo).
   */
  audio?: ScreenAccess | null;
}

/** A screen, rendered like its wall display: its numbers and the moments of what just happened. */
export function ScreenDisplay(props: ScreenDisplayProps) {
  const { language, theme, accent } = props.state.screen.settings;
  return (
    <DisplayProvider language={language} theme={theme} accent={accent} layout={props.layout} scale={props.scale}>
      <Display {...props} />
    </DisplayProvider>
  );
}

function Display({ state, online, layout, leading, trailing, onRefresh, footer, audio = null }: ScreenDisplayProps) {
  const { palette, scale } = useDisplay();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { settings } = state.screen;
  const [confetti, setConfetti] = useState<{ id: string; kind: Celebration } | null>(null);
  const momentAudio = useMomentAudio(audio, state);

  const { moment: playing, skip } = useMoments(state, (started) => {
    const seen = momentPlays(started, settings, "moment");
    momentAudio.play(started, state);
    // Haptics go with the wall's sound: they play when it would.
    if (seen || momentSound(started, settings) !== null) playMomentHaptic(started);
    const celebration = momentCelebration(started);
    if (celebration && settings.celebrations && seen && !reducedMotion) {
      setConfetti({ id: started.id, kind: celebration });
    }
  });
  // Events kept off screen only play their sound, voice and haptic.
  const moment = playing && momentPlays(playing, settings, "moment") ? playing : null;

  // A moment brings the slide of its account on screen: the numbers behind it are the ones it moves.
  const slides = rotationSlides(state);
  const focus = moment && moment.kind !== "test" ? (momentAccount(moment) ?? TOTAL) : undefined;
  const { slide, turn } = useRotation(slides, settings.rotation.seconds, focus);
  const rotation: RotationStatus | null =
    slides.length > 1 ? { slides, slide, turn, seconds: settings.rotation.seconds, paused: focus !== undefined } : null;
  const view = screenView(state, slide);

  const topBar = (
    <TopBar
      name={state.screen.name}
      accounts={state.accounts}
      showAccounts={state.status === "ready"}
      rotation={rotation}
      online={online}
      timeZone={settings.timeZone}
      leading={leading}
      trailing={trailing}
    />
  );
  const content =
    state.status === "ready" ? (
      // Each account of a rotation fades in with its own numbers.
      <Animated.View key={slide} entering={FadeIn.duration(400)} style={{ flex: layout === "wall" ? 1 : undefined }}>
        <Dashboard state={state} view={view} moment={moment} />
      </Animated.View>
    ) : (
      <StateStatus state={state} />
    );

  return (
    <View style={{ flex: 1, backgroundColor: palette.screen }}>
      <Backdrop />
      {layout === "wall" ? (
        <View
          style={{
            flex: 1,
            gap: 10 * scale,
            paddingTop: Math.max(insets.top, 12 * scale),
            paddingBottom: Math.max(insets.bottom, 14 * scale),
            paddingLeft: Math.max(insets.left, 20 * scale),
            paddingRight: Math.max(insets.right, 20 * scale),
          }}
        >
          {topBar}
          {content}
        </View>
      ) : (
        <>
          <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 16 * scale, paddingBottom: 8 }}>{topBar}</View>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 16 * scale,
              paddingTop: 8 * scale,
              paddingBottom: insets.bottom + 24,
              gap: 24 * scale,
            }}
            refreshControl={
              onRefresh && <PullToRefresh onRefresh={onRefresh} color={palette.glow} />
            }
          >
            {content}
            {footer}
          </ScrollView>
        </>
      )}
      <MomentOverlay
        moment={moment}
        state={state}
        onDismiss={() => {
          momentAudio.stop();
          setConfetti(null);
          skip();
        }}
      />
      {confetti && <Confetti key={confetti.id} kind={confetti.kind} colors={palette.confetti} />}
    </View>
  );
}

function PullToRefresh({ onRefresh, color, ...props }: { onRefresh: () => Promise<void>; color: string }) {
  const [refreshing, setRefreshing] = useState(false);
  return (
    <RefreshControl
      {...props}
      refreshing={refreshing}
      tintColor={color}
      colors={[color]}
      onRefresh={() => {
        setRefreshing(true);
        void onRefresh().finally(() => setRefreshing(false));
      }}
    />
  );
}

/** The hero number glows while MRR grows on screen, and dims softly when it shrinks. */
function mrrHighlight(moment: Moment | null): "up" | "down" | null {
  if (moment?.kind === "movement") return isMrrIncrease(moment.movement) ? "up" : "down";
  if (moment?.kind === "milestone") return "up";
  return null;
}

/**
 * The numbers of a ready screen. Portrait: everything stacked, the feed last. Landscape: MRR (or
 * ARR), goal, chart and tiles on the left, the live feed on the right, like the wall.
 */
function Dashboard({ state, view, moment }: { state: DisplayState; view: ScreenView; moment: Moment | null }) {
  const { scale, layout } = useDisplay();
  const { currency } = state;
  const { metrics, series } = view;
  const { settings } = state.screen;
  const now = useNow(60_000);
  const recurring = recurringMetric(settings.metric);
  const progress = goalProgress(
    { current: recurring.fromMrr(metrics.mrr), thirtyDaysAgo: recurring.fromMrr(metrics.mrr30DaysAgo) },
    view.goal,
    currency,
    new Date(now),
  );

  const hero = (
    <Hero
      metrics={metrics}
      recurring={recurring}
      currency={currency}
      account={view.account?.name ?? null}
      highlight={mrrHighlight(moment)}
      maxSize={layout === "wall" ? 50 : 64}
    />
  );
  const goal = (
    <GoalProgress progress={progress} recurring={recurring} currency={currency} timeZone={settings.timeZone} now={now} />
  );
  const chart = (
    <MrrChart
      series={series.mrr}
      recurring={recurring}
      currency={currency}
      range={settings.chartRange}
      target={progress.target}
      plotHeight={layout === "wall" ? undefined : 170}
    />
  );
  const tiles = (
    <KpiTiles metrics={metrics} recurring={recurring} currency={currency} timeZone={settings.timeZone} now={now} />
  );
  const feed = (
    <LiveFeed
      // Another set of accounts brings its history at once: none of it just arrived.
      key={state.accounts.map((account) => account.id).join()}
      feed={view.feed}
      recurring={recurring}
      currency={currency}
      timeZone={settings.timeZone}
      // An account's own feed needs no name: the screen says whose it is.
      showAccount={view.account === null && state.accounts.length > 1}
      warnings={state.warnings}
    />
  );

  if (layout === "wall") {
    return (
      <View style={{ flex: 1, flexDirection: "row", gap: 16 * scale }}>
        <View style={{ flex: 1, minWidth: 0, gap: 8 * scale }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 24 * scale }}>
            <View style={{ flex: 1, minWidth: 0 }}>{hero}</View>
            <View style={{ width: "42%", paddingBottom: 4 * scale }}>{goal}</View>
          </View>
          {chart}
          {tiles}
        </View>
        <View style={{ width: "34%" }}>{feed}</View>
      </View>
    );
  }
  return (
    <View style={{ gap: 24 * scale }}>
      {hero}
      {goal}
      {chart}
      {tiles}
      {feed}
    </View>
  );
}
