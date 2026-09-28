import { addDays } from "@/lib/display/time";
import type { DisplayState, SeriesPoint } from "@/lib/display/types";
import type { ChartRange, ScreenSettings } from "@/lib/screens/settings";

/**
 * Light structural check of a polled response: a captive portal or a proxy error page answering
 * `200` must not blank a screen that has been running fine for weeks.
 */
export function isDisplayState(value: unknown): value is DisplayState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;
  const isObject = (candidate: unknown) => typeof candidate === "object" && candidate !== null;
  return (
    typeof state.version === "string" &&
    typeof state.status === "string" &&
    typeof state.currency === "string" &&
    isObject(state.screen) &&
    isObject(state.metrics) &&
    isObject(state.series) &&
    Array.isArray((state.series as Record<string, unknown>).mrr) &&
    Array.isArray(state.feed) &&
    Array.isArray(state.accounts)
  );
}

export const CHART_RANGE_DAYS: Record<ChartRange, number> = { "30d": 30, "90d": 90, "12m": 365 };

/** Points within `range` of the last day of `series`. */
export function seriesInRange(series: readonly SeriesPoint[], range: ChartRange): SeriesPoint[] {
  const last = series.at(-1);
  if (!last) return [];
  const first = addDays(last.date, -CHART_RANGE_DAYS[range]);
  return series.filter((point) => point.date >= first);
}

/** Unsaved changes posted by the screen editor to its live preview. */
export interface PreviewOverride {
  name: string;
  settings: ScreenSettings;
}

/**
 * The state a display renders: the last fetched state with the editor's unsaved changes on top.
 * The currency stays the fetched one because amounts are converted by the server; a new currency
 * shows up with the first poll after saving.
 */
export function resolveDisplayState(
  state: DisplayState,
  override: PreviewOverride | null,
): DisplayState {
  const settings = override ? { ...override.settings, currency: state.currency } : null;
  const resolved = settings
    ? {
        ...state,
        screen: { name: override?.name ?? state.screen.name, settings },
        series: { ...state.series, mrr: seriesInRange(state.series.mrr, settings.chartRange) },
      }
    : state;

  if (resolved.screen.settings.showCustomerNames) return resolved;
  return {
    ...resolved,
    feed: resolved.feed.map((item) =>
      item.customerName === null ? item : { ...item, customerName: null },
    ),
  };
}
