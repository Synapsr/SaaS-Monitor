import { View } from "react-native";
import { recurringMetric } from "@/contract/display/metric";
import { goalProgress } from "@/contract/display/milestones";
import { isMrrIncrease, type Moment } from "@/contract/display/moments";
import type { ScreenView } from "@/contract/display/rotation";
import type { DisplayState } from "@/contract/display/types";
import { useDisplay } from "@/display/context";
import { GoalProgress } from "@/display/goal-progress";
import { Hero } from "@/display/hero";
import { KpiTiles } from "@/display/kpi-tiles";
import { LiveFeed } from "@/display/live-feed";
import { MrrChart } from "@/display/mrr-chart";
import { useNow } from "@/display/use-now";
import { Shareable } from "@/share/shareable";
import type { TileKey } from "@/share/subjects";

interface DashboardProps {
  state: DisplayState;
  view: ScreenView;
  moment: Moment | null;
}

/** The hero number glows while MRR grows on screen, and dims softly when it shrinks. */
function mrrHighlight(moment: Moment | null): "up" | "down" | null {
  if (moment?.kind === "movement") return isMrrIncrease(moment.movement) ? "up" : "down";
  if (moment?.kind === "milestone") return "up";
  return null;
}

/** The parts of a ready screen, for the screen itself and for images of each of them. */
export function useDashboardParts({ state, view, moment }: DashboardProps) {
  const { layout } = useDisplay();
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
  const tiles = (only?: TileKey) => (
    <KpiTiles metrics={metrics} recurring={recurring} currency={currency} timeZone={settings.timeZone} now={now} only={only} />
  );

  return {
    hero: (
      <Hero
        metrics={metrics}
        recurring={recurring}
        currency={currency}
        account={view.account?.name ?? null}
        highlight={mrrHighlight(moment)}
        maxSize={layout === "wall" ? 50 : 64}
      />
    ),
    goal: (
      <GoalProgress progress={progress} recurring={recurring} currency={currency} timeZone={settings.timeZone} now={now} />
    ),
    chart: (
      <MrrChart
        series={series.mrr}
        recurring={recurring}
        currency={currency}
        range={settings.chartRange}
        target={progress.target}
        plotHeight={layout === "wall" ? undefined : 170}
      />
    ),
    tiles: tiles(),
    tile: (key: TileKey) => tiles(key),
    feed: (
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
    ),
  };
}

/**
 * The numbers of a ready screen. Portrait: everything stacked, the feed last. Landscape: MRR (or
 * ARR), goal, chart and tiles on the left, the live feed on the right, like the wall. Touch and
 * hold any of them to share it.
 */
export function Dashboard(props: DashboardProps) {
  const { scale, layout } = useDisplay();
  const parts = useDashboardParts(props);
  const hero = <Shareable subject={{ kind: "hero" }}>{parts.hero}</Shareable>;
  const goal = <Shareable subject={{ kind: "goal" }}>{parts.goal}</Shareable>;
  const wall = layout === "wall";
  // The chart and the feed fill their column on a wall.
  const fill = wall ? { flex: 1, minHeight: 0 } : undefined;
  const chart = (
    <Shareable subject={{ kind: "chart" }} style={fill}>
      {parts.chart}
    </Shareable>
  );
  const feed = (
    <Shareable subject={{ kind: "feed" }} style={fill}>
      {parts.feed}
    </Shareable>
  );

  if (wall) {
    return (
      <View style={{ flex: 1, flexDirection: "row", gap: 16 * scale }}>
        <View style={{ flex: 1, minWidth: 0, gap: 8 * scale }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 24 * scale }}>
            <View style={{ flex: 1, minWidth: 0 }}>{hero}</View>
            <View style={{ width: "42%", paddingBottom: 4 * scale }}>{goal}</View>
          </View>
          {chart}
          {parts.tiles}
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
      {parts.tiles}
      {feed}
    </View>
  );
}
