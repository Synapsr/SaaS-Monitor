import { createElement, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp, ZoomIn } from "react-native-reanimated";
import { recurringMetric } from "@/contract/display/metric";
import { nextMilestone } from "@/contract/display/milestones";
import type { Moment } from "@/contract/display/moments";
import type { DisplayState } from "@/contract/display/types";
import type { Metric } from "@/contract/screens/settings";
import { formatMoney, toMajorUnits, toMinorUnits } from "@/contract/money";
import { useDisplay } from "@/display/context";
import { itemIcon } from "@/display/kind-icon";
import { describeMoment, momentAccountName, type MomentCardContent } from "@/display/moment-content";
import { RadialGlow } from "@/display/radial-glow";
import { DisplayText } from "@/display/text";
import { CircleDollarSignIcon, LogoPulse, PartyPopperIcon } from "@/ui/icons";

interface MomentOverlayProps {
  moment: Moment | null;
  state: DisplayState;
  /** A tap anywhere ends the moment: several waiting go by quickly. */
  onDismiss: () => void;
}

/** What is being celebrated right now: a card, or the whole screen for a milestone. */
export function MomentOverlay({ moment, state, onDismiss }: MomentOverlayProps) {
  const { locale } = useDisplay();
  if (!moment) return null;
  return (
    <Pressable
      onPress={onDismiss}
      style={StyleSheet.absoluteFill}
      accessibilityLiveRegion="polite"
      accessibilityRole="button"
      accessibilityHint="Dismisses this moment"
    >
      {moment.kind === "milestone" && state.screen.settings.celebrations ? (
        <MilestoneCelebration
          key={moment.id}
          amount={moment.amount}
          metric={moment.metric}
          isGoal={moment.isGoal}
          currency={state.currency}
          account={momentAccountName(moment, state)}
        />
      ) : (
        <MomentCard key={moment.id} {...describeMoment(moment, state, locale)} />
      )}
    </Pressable>
  );
}

const SPRING = FadeInDown.springify().damping(17).stiffness(140);

/** Staggered entrance of the parts of a moment: each settles a beat after the previous one. */
function Reveal({ delay, children }: { delay: number; children: ReactNode }) {
  return <Animated.View entering={SPRING.delay(delay)}>{children}</Animated.View>;
}

/** A large card in the middle of the screen, readable at a glance. */
function MomentCard({ icon, eyebrow, headline, headlineKind, metric, account, details, footnote, tone }: MomentCardContent) {
  const { palette, scale, layout } = useDisplay();
  const celebration = tone === "celebration";
  const wall = layout === "wall";
  const iconElement =
    icon === "party"
      ? PartyPopperIcon
      : icon === "dollar"
        ? CircleDollarSignIcon
        : itemIcon(icon.item);
  const eyebrowSize = wall ? 17 : 18;

  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(450).delay(100)} style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.scrim }]} />
      <Animated.View
        entering={FadeInDown.springify().damping(16).stiffness(130)}
        exiting={FadeOutUp.duration(350)}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={[account, eyebrow, headline, metric, ...details, footnote].filter(Boolean).join(", ")}
        style={{
          width: wall ? "64%" : "90%",
          maxWidth: 720 * scale,
          alignItems: "center",
          gap: 10 * scale,
          paddingHorizontal: 24 * scale,
          paddingVertical: (wall ? 24 : 32) * scale,
          borderRadius: 32 * scale,
          backgroundColor: palette.card,
          borderWidth: 1,
          borderColor: celebration ? palette.edge : palette.hairline,
          shadowColor: celebration ? palette.glow : "#000000",
          shadowOpacity: celebration ? 0.35 : 0.4,
          shadowRadius: 48 * scale,
          shadowOffset: { width: 0, height: 12 * scale },
        }}
      >
        {celebration && (
          <View style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, backgroundColor: palette.glow, opacity: 0.7 }} />
        )}
        {account && (
          <Reveal delay={40}>
            <AccountBadge name={account} />
          </Reveal>
        )}
        <Reveal delay={100}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 * scale }}>
            {createElement(iconElement, {
              size: eyebrowSize * 1.1 * scale,
              color: celebration ? palette.glowInk : palette.ink2,
              strokeWidth: 2.2,
            })}
            <DisplayText size={eyebrowSize} weight="500" tone={celebration ? "glowInk" : "ink2"}>
              {eyebrow}
            </DisplayText>
          </View>
        </Reveal>
        <Reveal delay={180}>
          {headlineKind === "amount" ? (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 * scale }}>
              <DisplayText
                size={wall ? 64 : 56}
                weight="600"
                tone={celebration ? "ink" : "ink2"}
                tabular
                tracking={-0.04}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1}
              >
                {headline}
              </DisplayText>
              {metric && (
                <DisplayText size={wall ? 24 : 22} weight="500" tone="ink3" maxFontSizeMultiplier={1}>
                  {metric}
                </DisplayText>
              )}
            </View>
          ) : (
            // Names run longer than amounts: smaller, and on two lines at most.
            <DisplayText size={wall ? 40 : 36} weight="600" tracking={-0.03} numberOfLines={2} style={{ textAlign: "center" }} maxFontSizeMultiplier={1.1}>
              {headline}
            </DisplayText>
          )}
        </Reveal>
        {details.length > 0 && (
          <Reveal delay={260}>
            <DisplayText size={wall ? 17 : 17} tone="ink2" style={{ textAlign: "center" }} numberOfLines={2}>
              {details.join(" · ")}
            </DisplayText>
          </Reveal>
        )}
        {footnote && (
          <Reveal delay={340}>
            <View
              style={{
                marginTop: 4 * scale,
                borderRadius: 999,
                paddingHorizontal: 16 * scale,
                paddingVertical: 7 * scale,
                // A loss is said plainly: no accent for when a subscription ends.
                backgroundColor: celebration ? palette.glowWash : palette.fill,
              }}
            >
              <DisplayText size={16} weight="500" tone={celebration ? "glowInk" : "ink2"} tabular style={{ textAlign: "center" }}>
                {footnote}
              </DisplayText>
            </View>
          </Reveal>
        )}
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Which account a moment comes from, when a screen shows several: the first thing read, so that
 * two moments of two accounts in a row are never mistaken for one another.
 */
function AccountBadge({ name }: { name: string }) {
  const { palette, scale } = useDisplay();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8 * scale,
        borderRadius: 999,
        paddingVertical: 5 * scale,
        paddingLeft: 11 * scale,
        paddingRight: 14 * scale,
        backgroundColor: palette.fill,
        borderWidth: 1,
        borderColor: palette.hairline,
      }}
    >
      <LogoPulse height={12 * scale} color={palette.glow} />
      <DisplayText size={15} weight="600" numberOfLines={1}>
        {name}
      </DisplayText>
    </View>
  );
}

interface MilestoneCelebrationProps {
  /** The milestone crossed, in minor units of `metric`. */
  amount: number;
  metric: Metric;
  isGoal: boolean;
  currency: string;
  account: string | null;
}

/** The whole screen for a milestone: a moment worth stopping for, then the next one to chase. */
function MilestoneCelebration({ amount, metric, isGoal, currency, account }: MilestoneCelebrationProps) {
  const { locale: displayLocale, palette, scale, layout } = useDisplay();
  const { locale, text } = displayLocale;
  const compact = (value: number) => formatMoney(value, currency, { compact: true, locale });
  const next = toMinorUnits(nextMilestone(toMajorUnits(amount, currency)), currency);
  const wall = layout === "wall";
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(800)}
      style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", overflow: "hidden" }]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${isGoal ? text.moments.goalReached : text.moments.newMilestone}: ${compact(amount)} ${recurringMetric(metric).label}`}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.screen, opacity: 0.96 }]} />
      <Animated.View
        entering={ZoomIn.duration(1600)}
        style={{ position: "absolute", width: 900 * scale, height: 900 * scale }}
      >
        <RadialGlow color={palette.glow} opacity={0.3} />
      </Animated.View>
      <View style={{ alignItems: "center", gap: 14 * scale, paddingHorizontal: 24 * scale }}>
        {account && (
          <Reveal delay={50}>
            <AccountBadge name={account} />
          </Reveal>
        )}
        <Reveal delay={150}>
          <DisplayText size={wall ? 22 : 22} weight="500" tone="glowInk" style={{ textAlign: "center" }}>
            {`🎉 ${isGoal ? text.moments.goalReached : text.moments.newMilestone}`}
          </DisplayText>
        </Reveal>
        <Animated.View entering={ZoomIn.springify().damping(12).delay(300)} style={{ flexDirection: "row", alignItems: "baseline" }}>
          <DisplayText size={wall ? 96 : 84} weight="600" tracking={-0.05} tabular numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1}>
            {compact(amount)}
          </DisplayText>
          <DisplayText size={wall ? 28 : 26} weight="500" tone="ink2" maxFontSizeMultiplier={1}>
            {` ${recurringMetric(metric).label}`}
          </DisplayText>
        </Animated.View>
        <Reveal delay={750}>
          <DisplayText size={18} tone="ink2" style={{ textAlign: "center" }}>
            {text.moments.nextStop(compact(next))}
          </DisplayText>
        </Reveal>
      </View>
    </Animated.View>
  );
}
