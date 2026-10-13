import type { ReactNode, Ref } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { screenView, type ScreenView } from "@/contract/display/rotation";
import type { DisplayState } from "@/contract/display/types";
import { Backdrop } from "@/display/backdrop";
import { DisplayProvider, useDisplay } from "@/display/context";
import { Dashboard, useDashboardParts } from "@/display/dashboard";
import { describeMoment } from "@/display/moment-content";
import { MilestoneFace, MomentCardFace } from "@/display/moment-overlay";
import { RadialGlow } from "@/display/radial-glow";
import { DisplayText } from "@/display/text";
import { itemMoment, sharedFeed, type ShareSubject } from "@/share/subjects";
import { LogoPulse } from "@/ui/icons";

/** Points: parts are laid out as on a phone, and the image is as wide as a phone's screenshot. */
export const SHARE_CARD_WIDTH = 390;

/** Where the people who see an image learn where it comes from. */
const SITE = "saas-monitor.com";
/** A part alone in an image is drawn larger than on the screen, where it shares the room. */
const ALONE_SCALE = 1.25;

interface ShareCardProps {
  /** The screen, already without what the image leaves out (see `shareSource`). */
  state: DisplayState;
  subject: ShareSubject;
  slide: string;
  /** When the image was asked for, in milliseconds. */
  at: number;
  /** The view to capture. */
  ref?: Ref<View>;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * An image of a screen or of one of its parts, in the screen's language and colors: dated at the
 * top, and signed at the bottom. Nothing in it moves, and it ignores this device's text size.
 */
export function ShareCard({ state, ...props }: ShareCardProps) {
  const { language, theme, accent } = state.screen.settings;
  return (
    <DisplayProvider language={language} theme={theme} accent={accent} layout="phone" scale={1} still>
      <Card state={state} {...props} />
    </DisplayProvider>
  );
}

function Card({ state, subject, slide, at, ref, onLayout }: ShareCardProps) {
  const { palette } = useDisplay();
  const view = screenView(state, slide);
  const shown = { ...view, feed: sharedFeed(subject, view.feed) };
  return (
    <View
      ref={ref}
      // Android draws the view itself, never a flattened copy.
      collapsable={false}
      onLayout={onLayout}
      style={{ width: SHARE_CARD_WIDTH, backgroundColor: palette.screen, overflow: "hidden" }}
    >
      <Backdrop />
      <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18, gap: 24 }}>
        <Header state={state} at={at} />
        {subject.kind === "screen" ? (
          <Dashboard state={state} view={shown} moment={null} />
        ) : (
          <Part state={state} subject={subject} view={shown} />
        )}
        <Signature />
      </View>
    </View>
  );
}

interface PartProps {
  state: DisplayState;
  subject: Exclude<ShareSubject, { kind: "screen" }>;
  view: ScreenView;
}

function Part({ state, subject, view }: PartProps) {
  const { locale, palette } = useDisplay();
  const parts = useDashboardParts({ state, view, moment: null });
  switch (subject.kind) {
    case "hero":
      return (
        <View style={{ paddingVertical: 8 }}>
          {/* The halo the wall lights while MRR grows. */}
          {view.metrics.mrr > view.metrics.mrr30DaysAgo && (
            <View pointerEvents="none" style={{ position: "absolute", left: "-25%", right: "-5%", top: "-40%", bottom: "-40%" }}>
              <RadialGlow color={palette.glow} opacity={0.18} />
            </View>
          )}
          {parts.hero}
        </View>
      );
    case "goal":
      return (
        <Alone state={state}>
          <View style={{ paddingVertical: 4 }}>{parts.goal}</View>
        </Alone>
      );
    case "chart":
      return parts.chart;
    case "tiles":
      return parts.tiles;
    case "tile":
      return <Alone state={state}>{parts.tile(subject.tile)}</Alone>;
    case "feed":
      return parts.feed;
    case "item":
      return <MomentCardFace {...describeMoment(itemMoment(subject.item), state, locale)} />;
    case "milestone": {
      const account = state.accounts.length > 1 ? state.accounts.find(({ id }) => id === subject.accountId)?.name : null;
      return (
        <View style={{ paddingVertical: 36 }}>
          <MilestoneFace
            amount={subject.amount}
            metric={subject.metric}
            isGoal={subject.isGoal}
            currency={state.currency}
            account={account ?? null}
          />
        </View>
      );
    }
  }
}

/** Draws a part larger, in the same language and colors. */
function Alone({ state, children }: { state: DisplayState; children: ReactNode }) {
  const { language, theme, accent } = state.screen.settings;
  return (
    <DisplayProvider language={language} theme={theme} accent={accent} layout="phone" scale={ALONE_SCALE} still>
      {children}
    </DisplayProvider>
  );
}

/** The screen's name, and when: in its time zone, its time written as its wall clock does. */
function Header({ state, at }: { state: DisplayState; at: number }) {
  const { locale, palette } = useDisplay();
  const testMode = state.accounts.some((account) => !account.livemode);
  const when = new Intl.DateTimeFormat(locale.locale, {
    timeZone: state.screen.settings.timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(at));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <DisplayText size={17} weight="600" tracking={-0.01} numberOfLines={1} style={{ flexShrink: 1 }}>
          {state.screen.name}
        </DisplayText>
        {testMode && (
          // Honest about it, as the screen itself is.
          <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: palette.warnInk }}>
            <DisplayText size={11} tone="warnInk" numberOfLines={1}>
              {locale.text.topBar.testData}
            </DisplayText>
          </View>
        )}
      </View>
      <DisplayText size={12} tone="ink3" tabular numberOfLines={1}>
        {when}
      </DisplayText>
    </View>
  );
}

/** "Powered by SaaS Monitor": the brand's words, the same in every language. */
function Signature() {
  const { palette } = useDisplay();
  return (
    <View style={{ gap: 14 }}>
      <View style={{ height: 1, backgroundColor: palette.hairline }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <LogoPulse height={13} color={palette.glow} />
        <DisplayText size={13} tone="ink3" numberOfLines={1} style={{ flex: 1 }}>
          Powered by{" "}
          <DisplayText size={13} weight="600" tone="ink2">
            SaaS Monitor
          </DisplayText>
        </DisplayText>
        <DisplayText size={12} tone="ink3" numberOfLines={1}>
          {SITE}
        </DisplayText>
      </View>
    </View>
  );
}
