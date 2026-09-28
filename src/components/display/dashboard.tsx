import { GoalProgress } from "@/components/display/goal-progress";
import { Hero } from "@/components/display/hero";
import { KpiTiles } from "@/components/display/kpi-tiles";
import { LiveFeed } from "@/components/display/live-feed";
import { MrrChart } from "@/components/display/mrr-chart";
import { useNow } from "@/lib/display/hooks/use-now";
import { goalProgress } from "@/lib/display/milestones";
import { isMrrIncrease, type Moment } from "@/lib/display/moments";
import type { DisplayState } from "@/lib/display/types";

interface DashboardProps {
  state: DisplayState;
  /** The moment being celebrated, which the numbers echo. */
  moment: Moment | null;
  serverTime: number;
}

/**
 * The numbers of a ready screen. Landscape: MRR, goal, chart and tiles on the left, the live feed
 * on the right. Portrait: everything stacked, the feed last.
 */
export function Dashboard({ state, moment, serverTime }: DashboardProps) {
  const { metrics, currency, series } = state;
  const { settings } = state.screen;
  const now = useNow(serverTime, 60_000);
  const progress = goalProgress(metrics, settings.goal, currency, new Date(now));

  return (
    <main className="grid min-h-0 flex-1 gap-12 portrait:grid-rows-[auto_minmax(0,1fr)] landscape:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
      <div className="flex min-h-0 flex-col gap-10 portrait:gap-9">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,calc(var(--rem)*26))] items-end gap-x-14 gap-y-9 portrait:grid-cols-1">
          <Hero metrics={metrics} currency={currency} highlight={mrrHighlight(moment)} />
          <GoalProgress
            progress={progress}
            currency={currency}
            timeZone={settings.timeZone}
            now={now}
            className="pb-3"
          />
        </div>
        <MrrChart
          series={series.mrr}
          currency={currency}
          range={settings.chartRange}
          target={progress.target}
          className="min-h-0 flex-1 pb-9 portrait:h-[calc(var(--u)*30)] portrait:flex-none"
        />
        <KpiTiles metrics={metrics} currency={currency} timeZone={settings.timeZone} now={now} />
      </div>
      <LiveFeed
        feed={state.feed}
        currency={currency}
        timeZone={settings.timeZone}
        serverTime={serverTime}
        showAccount={state.accounts.length > 1}
        warnings={state.warnings}
      />
    </main>
  );
}

/** The hero number glows while MRR grows on screen, and dims softly when it shrinks. */
function mrrHighlight(moment: Moment | null): "up" | "down" | null {
  if (moment?.kind === "movement") return isMrrIncrease(moment.movement) ? "up" : "down";
  if (moment?.kind === "payment" && moment.movement) return "up";
  if (moment?.kind === "milestone") return "up";
  return null;
}
