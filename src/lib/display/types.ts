import type { ScreenSettings } from "@/lib/screens/settings";

/**
 * Contract between the server and a wall display, returned by `GET /api/screens/:token/state`
 * and used for the first render of `/d/:token`.
 *
 * Every amount is an integer in the minor unit (e.g. cents) of `DisplayState.currency`, already
 * converted from the Stripe accounts' currencies. Anyone with the screen's link can read it: it
 * only holds what the screen shows.
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
    /**
     * MRR at the end of the days of `settings.chartRange`, oldest first, the last one being
     * today's: every day, or the end of each week or month of a long history (`chartDays`).
     */
    mrr: SeriesPoint[];
  };
  /**
   * Each ready account on its own, when the screen shows several: a screen may rotate between
   * them (`settings.rotation`). Empty for a screen of a single account. Amounts are in the
   * screen's currency, like the combined ones.
   */
  views: AccountView[];
  /** Most recent activity first, of every account. */
  feed: FeedItem[];
  /** Present after "Send a test celebration" was clicked in the settings. */
  testEvent: { id: string } | null;
  /** Issues worth surfacing discreetly, written by the display in the screen's language. */
  warnings: DisplayWarning[];
}

/** The numbers of one Stripe account of the screen. */
export interface AccountView {
  /** As in `DisplayState.accounts`. */
  accountId: string;
  metrics: DisplayMetrics;
  series: DisplayState["series"];
}

export type DisplayWarning =
  /** Amounts in this currency are left out: no exchange rate is available right now. */
  | { kind: "unconverted-currency"; currency: string }
  /** This account fails to sync, e.g. its API key was revoked. The dashboard tells why. */
  | { kind: "failing-account"; accountName: string };

export interface DisplayAccount {
  id: string;
  name: string;
  status: "importing" | "ready" | "error";
  livemode: boolean;
}

export interface DisplayMetrics {
  mrr: number;
  /** MRR 30 days ago, for the growth badge. */
  mrr30DaysAgo: number;
  arr: number;
  /** Customers with at least one paying subscription. */
  activeCustomers: number;
  trialingSubscriptions: number;
  /** Average revenue per paying customer (MRR / active customers). */
  arpu: number;
  /** Stripe customers created today (screen time zone), paying or not: often sign-ups. */
  customersCreatedToday: number;
  revenue: {
    today: number;
    yesterday: number;
    monthToDate: number;
    /** Same number of days at the start of the previous month, for a fair comparison. */
    previousMonthToDate: number;
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
    /** Customers who started paying this month. */
    newCustomers: number;
  };
}

export interface SeriesPoint {
  /** Calendar day in the screen time zone, `YYYY-MM-DD`. */
  date: string;
  value: number;
}

export type MrrMovementKind = "new" | "expansion" | "reactivation" | "contraction" | "churn";
/** `customer`: a Stripe customer was created, before they pay anything, if they ever do. */
export type FeedItemKind = "payment" | "customer" | MrrMovementKind;

export interface FeedItem {
  /**
   * Unique across kinds and stable across polls: `payment:<uuid>`, `movement:<uuid>` or
   * `customer:<uuid>`.
   */
  id: string;
  kind: FeedItemKind;
  /** Payment amount, monthly MRR change (negative for contraction and churn), or 0 for a customer. */
  amount: number;
  /** Amount before conversion, when the payment or subscription used another currency. */
  original: { amount: number; currency: string } | null;
  occurredAt: string;
  /** Detected by the live sync rather than imported from history: may play sounds and confetti. */
  live: boolean;
  /**
   * The same for every item of a customer, and opaque: it cannot be traced back to them. `null`
   * for payments without a customer.
   */
  customerKey: string | null;
  /** Only filled when the screen shows customer names. */
  customerName: string | null;
  /** ISO 3166-1 alpha-2 code, e.g. `FR`. */
  country: string | null;
  planName: string | null;
  /** As in `DisplayState.accounts`. */
  accountId: string;
  accountName: string;
}
