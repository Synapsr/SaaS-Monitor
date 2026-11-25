/**
 * Small views of the RevenueCat REST API v2 and webhook objects the app reads.
 * Amounts in `RevenueCatOverview` and chart parsers are normalized to integer minor units
 * (e.g. cents) at the boundary, matching the rest of the app.
 */

export interface RevenueCatProject {
  id: string;
  name: string;
}

export interface RevenueCatOverviewMetric {
  id: string;
  name: string;
  unit: string;
  period: string;
  value: number;
  lastUpdatedAt: Date | null;
}

export interface RevenueCatOverview {
  /** ISO 4217 code, lowercase (e.g. `usd`). */
  currency: string;
  /** Current MRR in minor units of `currency`. */
  mrr: number;
  /** Active paying subscriptions. */
  activeSubscriptions: number;
  /** Active free trials. */
  activeTrials: number;
  /** Most recent update timestamp reported by RevenueCat. */
  updatedAt: Date;
}

export interface RevenueCatChartMeasure {
  displayName: string;
  unit: string | null;
  chartable: boolean;
}

export interface RevenueCatChartData {
  currency: string;
  resolution: string;
  measures: RevenueCatChartMeasure[];
  values: unknown[];
}

export interface RevenueCatProduct {
  id: string;
  storeIdentifier: string;
  displayName: string | null;
  type: string;
  /** ISO 8601 duration (`P1W`, `P1M`, `P2M`, `P3M`, `P6M`, `P1Y`) or `null`. */
  duration: string | null;
}

export interface RevenueCatDailyRow {
  /** `YYYY-MM-DD` UTC calendar day. */
  day: string;
  currency: string;
  revenue: number;
  mrrNew: number;
  mrrExpansion: number;
  mrrReactivation: number;
  /** Stored <= 0, matching `mrrMovements`. */
  mrrContraction: number;
  /** Stored <= 0, matching `mrrMovements`. */
  mrrChurn: number;
  newPayingCustomers: number;
  newCustomers: number;
}
