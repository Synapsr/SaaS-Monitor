import { isGoodNews, itemAmount, itemKindLabel } from "@/lib/display/feed";
import { formatAmount, formatPercent, percentChange } from "@/lib/display/format";
import { displayLocale } from "@/lib/display/i18n";
import { recurringMetric } from "@/lib/display/metric";
import { screenView, TOTAL } from "@/lib/display/rotation";
import { formatFeedTime } from "@/lib/display/time";
import type { DisplayState, FeedItem } from "@/lib/display/types";

/**
 * A screen at a glance, for the dashboard's list of screens: what its wall shows right now, in
 * its language and currency. Built from the screen's `DisplayState`, like the wall itself.
 *
 * - `empty`, `importing`, `error`: the wall shows its status instead of numbers (no Stripe account,
 *   the first import, failing accounts).
 * - `quiet`: imported, but nothing to show yet: no recurring revenue and no activity.
 * - `live`: the headline number, its trend over 30 days, its curve and the latest event.
 */
export type ScreenSnapshot =
  | { kind: Exclude<DisplayState["status"], "ready"> }
  | {
      kind: "quiet";
      title: string;
      value: string;
      /** What the wall's empty feed says while it waits for a first event. */
      caption: string;
    }
  | {
      kind: "live";
      /** "Monthly recurring revenue", as the wall titles its number. */
      title: string;
      /** MRR or ARR, as the screen shows it: "$12,480". */
      value: string;
      growth: SnapshotGrowth | null;
      /** The MRR chart's values, oldest first (the wall's `chartRange`). */
      series: number[];
      latest: SnapshotEvent | null;
    };

/** How the headline moved over 30 days: "+8.2%", or "+$420" without a value to compare with. */
export interface SnapshotGrowth {
  label: string;
  /** "in 30 days", in the screen's language. */
  period: string;
  trend: "up" | "down" | "flat";
}

/** The newest item of the screen's feed: "$79 · Payment · 3 min ago". */
export interface SnapshotEvent {
  item: FeedItem;
  /** `null` for a new customer, who brings no amount. */
  amount: string | null;
  kind: string;
  time: string;
  goodNews: boolean;
}

export function screenSnapshot(state: DisplayState): ScreenSnapshot {
  if (state.status !== "ready") return { kind: state.status };

  const { settings } = state.screen;
  const locale = displayLocale(settings.language);
  const recurring = recurringMetric(settings.metric);
  // What the wall shows first: the combined numbers, and the events its feed lists.
  const view = screenView(state, TOTAL);
  const title = locale.text.metricNames[recurring.metric];
  const current = recurring.fromMrr(view.metrics.mrr);
  const value = formatAmount(current, state.currency, locale.locale);
  const [newest] = view.feed;
  if (current === 0 && !newest) {
    return { kind: "quiet", title, value, caption: locale.text.feed.empty };
  }

  return {
    kind: "live",
    title,
    value,
    growth: snapshotGrowth(current, recurring.fromMrr(view.metrics.mrr30DaysAgo), state),
    series: view.series.mrr.map((point) => recurring.fromMrr(point.value)),
    latest: newest ? snapshotEvent(newest, state) : null,
  };
}

function snapshotGrowth(current: number, before: number, state: DisplayState): SnapshotGrowth {
  const { locale, text } = displayLocale(state.screen.settings.language);
  const change = current - before;
  const ratio = percentChange(current, before);
  return {
    label:
      ratio === null
        ? formatAmount(change, state.currency, locale, { signed: true })
        : formatPercent(ratio, locale, { signed: true }),
    period: text.hero.inThirtyDays,
    trend: change > 0 ? "up" : change < 0 ? "down" : "flat",
  };
}

/** A feed item as the wall's feed writes it, its time relative to when the state was made. */
export function snapshotEvent(item: FeedItem, state: DisplayState): SnapshotEvent {
  const { settings } = state.screen;
  const locale = displayLocale(settings.language);
  const recurring = recurringMetric(settings.metric);
  return {
    item,
    amount: itemAmount(item, state.currency, recurring, locale.locale),
    kind: itemKindLabel(item, locale.text),
    time: formatFeedTime(
      new Date(item.occurredAt),
      new Date(state.generatedAt),
      settings.timeZone,
      locale,
    ),
    goodNews: isGoodNews(item.kind),
  };
}

/** The event in one line, for those who read it rather than see it. */
export function snapshotEventText({ amount, kind, time }: SnapshotEvent): string {
  return [amount, kind, time].filter(Boolean).join(" · ");
}
