import type { ScreenSettings } from "@/lib/screens/settings";

/**
 * Contract between the server and a wall display, returned by `GET /api/screens/:token/state`
 * and used for the first render of `/d/:token`.
 *
 * Every amount is an integer in the minor unit (e.g. cents) of `DisplayState.currency`, already
 * converted from the Stripe accounts' currencies.
 */
export interface DisplayState {
  /** Server build identifier: an open display reloads itself when it changes. */
  version: string;
  generatedAt: string;
  screen: { name: string; settings: ScreenSettings };
  /** ISO 4217 code, lowercase. Same as `screen.settings.currency`. */
  currency: string;
  /**
   * - `empty`: no Stripe account is linked to the screen yet.
   * - `importing`: the first import is still running and metrics are incomplete.
   * - `error`: every linked account is failing (e.g. revoked key).
   */
  status: "empty" | "importing" | "ready" | "error";
  accounts: DisplayAccount[];
  metrics: DisplayMetrics;
  series: {
    /** Daily MRR at the end of each day, over `settings.chartRange`, oldest first. */
    mrr: SeriesPoint[];
    /** Daily net revenue (payments minus refunds) over the last 30 days, oldest first. */
    revenue: SeriesPoint[];
  };
  /** Most recent activity first. */
  feed: FeedItem[];
  /** Present after "Send a test celebration" was clicked in the settings. */
  testEvent: { id: string; at: string } | null;
  /** Human-readable issues worth surfacing discreetly, e.g. a currency that could not be converted. */
  warnings: string[];
}

export interface DisplayAccount {
  id: string;
  name: string;
  status: "importing" | "ready" | "error";
  livemode: boolean;
  mrr: number;
}

export interface DisplayMetrics {
  mrr: number;
  /** MRR 30 days ago, for the growth badge. */
  mrr30DaysAgo: number;
  arr: number;
  activeSubscriptions: number;
  /** Customers with at least one paying subscription. */
  activeCustomers: number;
  trialingSubscriptions: number;
  /** Average revenue per paying customer (MRR / active customers). */
  arpu: number;
  revenue: {
    today: number;
    yesterday: number;
    monthToDate: number;
    /** Same number of days at the start of the previous month, for a fair comparison. */
    previousMonthToDate: number;
    last30Days: number;
  };
  /**
   * MRR movements since the first day of the current month (screen time zone).
   * `new`, `expansion` and `reactivation` are ≥ 0; `contraction` and `churn` are ≤ 0.
   */
  thisMonth: {
    new: number;
    expansion: number;
    reactivation: number;
    contraction: number;
    churn: number;
    net: number;
    newCustomers: number;
    churnedCustomers: number;
  };
}

export interface SeriesPoint {
  /** Calendar day in the screen time zone, `YYYY-MM-DD`. */
  date: string;
  value: number;
}

export type MrrMovementKind = "new" | "expansion" | "reactivation" | "contraction" | "churn";
export type FeedItemKind = "payment" | MrrMovementKind;

export interface FeedItem {
  /** Unique across kinds and stable across polls, e.g. `payment:<uuid>` or `movement:<uuid>`. */
  id: string;
  kind: FeedItemKind;
  /** Payment amount, or monthly MRR change (negative for contraction and churn). */
  amount: number;
  /** Amount before conversion, when the payment or subscription used another currency. */
  original: { amount: number; currency: string } | null;
  occurredAt: string;
  /** Detected by the live sync rather than imported from history: may play sounds and confetti. */
  live: boolean;
  /** Only filled when the screen shows customer names. */
  customerName: string | null;
  /** ISO 3166-1 alpha-2 code, e.g. `FR`. */
  country: string | null;
  planName: string | null;
  accountName: string;
}
