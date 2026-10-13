import { useState, type ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMomentAudio } from "@/audio/use-moment-audio";
import { momentPlays } from "@/contract/display/events";
import { momentAccount, momentCelebration, momentSound, type Celebration } from "@/contract/display/moments";
import { rotationSlides, screenView, TOTAL } from "@/contract/display/rotation";
import type { DisplayState } from "@/contract/display/types";
import { Backdrop } from "@/display/backdrop";
import { Confetti } from "@/display/confetti";
import { DisplayProvider, useDisplay, type DisplayLayout } from "@/display/context";
import { Dashboard } from "@/display/dashboard";
import { playMomentHaptic } from "@/display/haptics";
import { MomentOverlay } from "@/display/moment-overlay";
import { StateStatus } from "@/display/status-message";
import { TopBar, type RotationStatus } from "@/display/top-bar";
import { useMoments } from "@/display/use-moments";
import { useRotation } from "@/display/use-rotation";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { ScreenAccess } from "@/screens/api";
import type { ShareRequest } from "@/share/requests";
import { ScreenshotOffer } from "@/share/screenshot-offer";
import { ShareContext } from "@/share/shareable";
import type { ShareSubject } from "@/share/subjects";

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
  /** Sharing images of the screen, in the app; without, nothing is shared (the demo). */
  sharing?: ScreenSharing;
}

export interface ScreenSharing {
  /** Opens the share sheet. */
  onShare: (request: Omit<ShareRequest, "at">) => void;
  /** The top bar's share button. */
  button: (onPress: () => void) => ReactNode;
  /** Offers a cleaner image after a screenshot: while the screen is in front. */
  offerOnScreenshot: boolean;
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

function Display({ state, online, layout, leading, trailing, onRefresh, footer, audio = null, sharing }: ScreenDisplayProps) {
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
  // What is on screen, as it is now: the share sheet draws its image from it.
  const share =
    sharing && state.status === "ready"
      ? (subject: ShareSubject) => sharing.onShare({ subject, slide, state })
      : null;

  const topBar = (
    <TopBar
      name={state.screen.name}
      accounts={state.accounts}
      showAccounts={state.status === "ready"}
      rotation={rotation}
      online={online}
      timeZone={settings.timeZone}
      leading={leading}
      trailing={
        <>
          {share && sharing?.button(() => share({ kind: "screen" }))}
          {trailing}
        </>
      }
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
    <ShareContext value={share}>
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
        {share && sharing?.offerOnScreenshot && <ScreenshotOffer onShare={() => share({ kind: "screen" })} />}
      </View>
    </ShareContext>
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
