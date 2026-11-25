import "server-only";
import { DAY_MS } from "@/lib/durations";
import { toMinorUnits } from "@/lib/money";
import type { BillingInterval } from "@/server/stripe/mrr";
import type {
  RevenueCatChartData,
  RevenueCatChartMeasure,
  RevenueCatDailyRow,
  RevenueCatOverview,
} from "./types";

const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}/;

/** Converts a RevenueCat timestamp (seconds, ms, or ISO date) to a UTC `YYYY-MM-DD` day string. */
export function toUtcDay(input: unknown): string | null {
  if (typeof input === "string") {
    if (ISO_DAY_PATTERN.test(input)) return input.slice(0, 10);
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return unixToUtcDay(parsed);
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  if (typeof input === "number" && Number.isFinite(input)) {
    return unixToUtcDay(input);
  }
  return null;
}

function unixToUtcDay(value: number): string {
  // Timestamps >= 1e12 are milliseconds (year ~2001+); smaller values are Unix seconds.
  const ms = Math.abs(value) >= 1e12 ? value : value * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Parses `GET /v2/projects/{project_id}/metrics/overview` into integer minor units. */
export function parseOverviewMetrics(
  raw: {
    currency?: string | null;
    metrics?: readonly {
      id?: string;
      value?: number;
      last_updated_at?: number | null;
    }[];
  },
  fallbackNow: Date,
): RevenueCatOverview {
  const currency = (raw.currency ?? "USD").toLowerCase();
  const byId = new Map<string, { value: number; lastUpdatedAt: number | null }>();
  let latestMs: number | null = null;

  for (const metric of raw.metrics ?? []) {
    if (!metric.id || typeof metric.value !== "number" || !Number.isFinite(metric.value)) continue;
    const updated =
      typeof metric.last_updated_at === "number" && Number.isFinite(metric.last_updated_at)
        ? metric.last_updated_at
        : null;
    byId.set(metric.id, { value: metric.value, lastUpdatedAt: updated });
    if (updated !== null && (latestMs === null || updated > latestMs)) {
      latestMs = updated;
    }
  }

  const mrrMajor = byId.get("mrr")?.value ?? 0;
  const activeSubscriptions = Math.max(0, Math.round(byId.get("active_subscriptions")?.value ?? 0));
  const activeTrials = Math.max(0, Math.round(byId.get("active_trials")?.value ?? 0));

  return {
    currency,
    mrr: toMinorUnits(mrrMajor, currency),
    activeSubscriptions,
    activeTrials,
    updatedAt: latestMs !== null ? new Date(latestMs) : fallbackNow,
  };
}

export interface ParsedDayPoint {
  /** Measure values keyed by index (0-based into `chart.measures`, or 0 for single-series). */
  byIndex: Map<number, number>;
  /** Measure values keyed by lowercase name when provided directly as an object. */
  byName: Map<string, number>;
}

/**
 * Extracts daily points from a RevenueCat Charts API v2/v3 response.
 * Supports:
 * - Charts v3 object points: `{ cohort, measure, value, incomplete? }`
 * - Standard object points: `{ timestamp | date, value }` or `{ timestamp | date, measures: { ... } }`
 * - Tuple array points: `[unixSeconds, value0, value1, ...]`
 */
export function parseChartValues(chart: RevenueCatChartData): Map<string, ParsedDayPoint> {
  const days = new Map<string, ParsedDayPoint>();
  const ensure = (day: string): ParsedDayPoint => {
    let entry = days.get(day);
    if (!entry) {
      entry = { byIndex: new Map(), byName: new Map() };
      days.set(day, entry);
    }
    return entry;
  };

  for (const item of chart.values) {
    if (Array.isArray(item)) {
      const day = toUtcDay(item[0]);
      if (!day) continue;
      const entry = ensure(day);
      for (let i = 1; i < item.length; i += 1) {
        const value = item[i];
        if (typeof value === "number" && Number.isFinite(value)) {
          entry.byIndex.set(i - 1, value);
        }
      }
      continue;
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const day = toUtcDay(record.cohort ?? record.date ?? record.timestamp);
      if (!day) continue;
      const entry = ensure(day);

      if (
        record.measures &&
        typeof record.measures === "object" &&
        !Array.isArray(record.measures)
      ) {
        for (const [key, value] of Object.entries(record.measures as Record<string, unknown>)) {
          if (typeof value === "number" && Number.isFinite(value)) {
            entry.byName.set(key.toLowerCase(), value);
          }
        }
        continue;
      }

      if (typeof record.value === "number" && Number.isFinite(record.value)) {
        const measureIndex =
          typeof record.measure === "number" && Number.isInteger(record.measure)
            ? record.measure
            : 0;
        entry.byIndex.set(measureIndex, record.value);
      }
    }
  }

  return days;
}

function measureIndexMatching(
  measures: readonly RevenueCatChartMeasure[],
  predicate: (measure: RevenueCatChartMeasure, name: string) => boolean,
): number | null {
  for (let i = 0; i < measures.length; i += 1) {
    if (predicate(measures[i], measures[i].displayName.toLowerCase())) return i;
  }
  return null;
}

function pointMeasureValue(
  point: ParsedDayPoint,
  index: number | null,
  nameKeys: readonly string[],
): number {
  if (index !== null) {
    const value = point.byIndex.get(index);
    if (value !== undefined) return value;
  }
  for (const key of nameKeys) {
    const value = point.byName.get(key);
    if (value !== undefined) return value;
  }
  return 0;
}

function primaryAmountValue(
  point: ParsedDayPoint,
  measures: readonly RevenueCatChartMeasure[],
): number {
  const moneyIndex =
    measureIndexMatching(
      measures,
      (m, name) => m.unit !== "#" && (name.includes("revenue") || name.includes("proceeds")),
    ) ??
    measureIndexMatching(measures, (m) => m.unit !== "#" && m.chartable) ??
    measureIndexMatching(measures, (m) => m.unit !== "#") ??
    0;
  return point.byIndex.get(moneyIndex) ?? point.byName.get("revenue") ?? point.byIndex.get(0) ?? 0;
}

function primaryCountValue(
  point: ParsedDayPoint,
  measures: readonly RevenueCatChartMeasure[],
): number {
  const countIndex =
    measureIndexMatching(measures, (m) => m.unit === "#" && m.chartable) ??
    measureIndexMatching(measures, (m) => m.unit === "#") ??
    0;
  return point.byIndex.get(countIndex) ?? point.byIndex.get(0) ?? 0;
}

/**
 * Combines RevenueCat daily charts (`mrr_movement`, `revenue`, `actives_new`, `customers_new`)
 * into normalized daily rows in `currency`'s minor unit.
 */
export function buildDailyMetricRows(input: {
  currency: string;
  mrrMovement: RevenueCatChartData | null;
  revenue: RevenueCatChartData | null;
  activesNew: RevenueCatChartData | null;
  customersNew: RevenueCatChartData | null;
}): RevenueCatDailyRow[] {
  const currency = input.currency.toLowerCase();
  const rows = new Map<string, RevenueCatDailyRow>();
  const ensure = (day: string): RevenueCatDailyRow => {
    let row = rows.get(day);
    if (!row) {
      row = {
        day,
        currency,
        revenue: 0,
        mrrNew: 0,
        mrrExpansion: 0,
        mrrReactivation: 0,
        mrrContraction: 0,
        mrrChurn: 0,
        newPayingCustomers: 0,
        newCustomers: 0,
      };
      rows.set(day, row);
    }
    return row;
  };

  if (input.mrrMovement) {
    const measures = input.mrrMovement.measures;
    const movementCurrency = (input.mrrMovement.currency || currency).toLowerCase();
    const idxNew = measureIndexMatching(
      measures,
      (_, n) => n.includes("new") && !n.includes("net"),
    );
    const idxResub = measureIndexMatching(
      measures,
      (_, n) => n.includes("resub") || n.includes("reactivat"),
    );
    const idxExpansion = measureIndexMatching(measures, (_, n) => n.includes("expansion"));
    const idxContraction = measureIndexMatching(measures, (_, n) => n.includes("contraction"));
    const idxChurn = measureIndexMatching(measures, (_, n) => n.includes("churn"));

    for (const [day, point] of parseChartValues(input.mrrMovement)) {
      const row = ensure(day);
      row.mrrNew = Math.max(
        0,
        toMinorUnits(pointMeasureValue(point, idxNew, ["new_mrr", "new"]), movementCurrency),
      );
      row.mrrReactivation = Math.max(
        0,
        toMinorUnits(
          pointMeasureValue(point, idxResub, [
            "resubscription_mrr",
            "reactivation_mrr",
            "resubscription",
          ]),
          movementCurrency,
        ),
      );
      row.mrrExpansion = Math.max(
        0,
        toMinorUnits(
          pointMeasureValue(point, idxExpansion, ["expansion_mrr", "expansion"]),
          movementCurrency,
        ),
      );
      // SaaS Monitor stores contraction and churn as negative integers (<= 0).
      row.mrrContraction = -Math.abs(
        toMinorUnits(
          pointMeasureValue(point, idxContraction, ["contraction_mrr", "contraction"]),
          movementCurrency,
        ),
      );
      row.mrrChurn = -Math.abs(
        toMinorUnits(
          pointMeasureValue(point, idxChurn, ["churned_mrr", "churn_mrr", "churn"]),
          movementCurrency,
        ),
      );
    }
  }

  if (input.revenue) {
    const revCurrency = (input.revenue.currency || currency).toLowerCase();
    for (const [day, point] of parseChartValues(input.revenue)) {
      const row = ensure(day);
      row.revenue = toMinorUnits(primaryAmountValue(point, input.revenue.measures), revCurrency);
    }
  }

  if (input.activesNew) {
    for (const [day, point] of parseChartValues(input.activesNew)) {
      const row = ensure(day);
      row.newPayingCustomers = Math.max(
        0,
        Math.round(primaryCountValue(point, input.activesNew.measures)),
      );
    }
  }

  if (input.customersNew) {
    for (const [day, point] of parseChartValues(input.customersNew)) {
      const row = ensure(day);
      row.newCustomers = Math.max(
        0,
        Math.round(primaryCountValue(point, input.customersNew.measures)),
      );
    }
  }

  return [...rows.values()].sort((a, b) => a.day.localeCompare(b.day));
}

const ISO_DURATION_PATTERN = /^P(\d+)([DWMY])$/i;

const PERIODS_PER_MONTH: Record<BillingInterval, { numerator: number; denominator: number }> = {
  day: { numerator: 365, denominator: 12 },
  week: { numerator: 52, denominator: 12 },
  month: { numerator: 1, denominator: 1 },
  year: { numerator: 1, denominator: 12 },
};

const UNIT_TO_INTERVAL: Record<string, BillingInterval> = {
  D: "day",
  W: "week",
  M: "month",
  Y: "year",
};

/** Parses an ISO 8601 RevenueCat product duration (e.g. `P1M`, `P1Y`, `P1W`). */
export function parseIsoDuration(
  duration: string | null | undefined,
): { interval: BillingInterval; count: number } | null {
  if (!duration) return null;
  const match = ISO_DURATION_PATTERN.exec(duration.trim());
  if (!match) return null;
  const count = Number(match[1]);
  const interval = UNIT_TO_INTERVAL[match[2].toUpperCase()];
  if (!interval || !Number.isFinite(count) || count <= 0) return null;
  return { interval, count };
}

/** Infers billing interval & count from period length in ms when product metadata is unavailable. */
export function inferDurationFromPeriodMs(
  periodMs: number | null | undefined,
): { interval: BillingInterval; count: number } | null {
  if (!periodMs || !Number.isFinite(periodMs) || periodMs <= 0) return null;
  const days = periodMs / DAY_MS;
  if (days >= 350 && days <= 380) return { interval: "year", count: 1 };
  if (days >= 175 && days <= 190) return { interval: "month", count: 6 };
  if (days >= 84 && days <= 96) return { interval: "month", count: 3 };
  if (days >= 55 && days <= 65) return { interval: "month", count: 2 };
  if (days >= 26 && days <= 33) return { interval: "month", count: 1 };
  if (days >= 12 && days <= 16) return { interval: "week", count: 2 };
  if (days >= 6 && days <= 8) return { interval: "week", count: 1 };
  if (days >= 1 && days < 6) return { interval: "day", count: Math.max(1, Math.round(days)) };
  return null;
}

/** Normalizes a subscription price (in minor units) to monthly recurring revenue. */
export function normalizeMonthlyMrr(
  amountMinor: number,
  duration: string | null | undefined,
  periodMs?: number | null,
): number {
  if (amountMinor <= 0) return 0;
  const parsed = parseIsoDuration(duration) ?? inferDurationFromPeriodMs(periodMs);
  if (parsed) {
    const { numerator, denominator } = PERIODS_PER_MONTH[parsed.interval];
    return Math.round((amountMinor * numerator) / (denominator * parsed.count));
  }
  if (periodMs && periodMs > 0) {
    const days = periodMs / DAY_MS;
    return Math.round((amountMinor * 365) / (12 * days));
  }
  return amountMinor;
}

export function billingIntervalOf(
  duration: string | null | undefined,
  periodMs?: number | null,
): BillingInterval | null {
  return (parseIsoDuration(duration) ?? inferDurationFromPeriodMs(periodMs))?.interval ?? null;
}
