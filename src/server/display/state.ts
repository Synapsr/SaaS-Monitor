import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { BUILD_ID } from "@/lib/build-id";
import { calendarDay, chartStart, displayCalendar } from "@/lib/display/calendar";
import { shownEmail } from "@/lib/display/customer";
import { FEED_EVENTS } from "@/lib/display/events";
import type { DisplayState, DisplayWarning, FeedItem } from "@/lib/display/types";
import { MINUTE_MS } from "@/lib/durations";
import { parseScreenSettings, type ScreenSettings } from "@/lib/screens/settings";
import { createCurrencyConverter, type CurrencyConverter, type RateSource } from "@/server/fx";
import { canSynthesize } from "@/server/voice/gradium";
import { displayStatus, earliestDay, metricsOf, type AccountFigures } from "./metrics";
import {
  customersCreatedSince,
  findScreen,
  latestActivity,
  newestFirst,
  linkedAccounts,
  movementsByDay,
  newCustomerCounts,
  payingCustomerCounts,
  revenueByDay,
  subscriptionTotals,
  type ActivityRow,
} from "./queries";

export interface DisplayStateOptions {
  now?: Date;
  /** Exchange rates source, for tests. */
  rateSource?: RateSource;
}

/** Screen links carry a 32-character token (`generatePublicToken`): longer is not worth a query. */
const tokenSchema = z.string().min(1).max(256);

/** Whether a token from a public URL may be a screen's, before it costs a query or memory. */
export function isScreenToken(token: string): boolean {
  return tokenSchema.safeParse(token).success;
}

const FEED_LENGTH = 20;
/** How long a "Send a test celebration" request stays visible to displays that poll. */
const TEST_EVENT_TTL_MS = 10 * MINUTE_MS;

/**
 * Everything a wall display shows, or `null` when no screen uses this token. The token comes
 * straight from a public URL: it is validated here, for the page and the polling endpoint alike.
 */
export async function getDisplayStateByToken(
  token: string,
  { now = new Date(), rateSource }: DisplayStateOptions = {},
): Promise<DisplayState | null> {
  if (!isScreenToken(token)) return null;
  const screen = await findScreen(token);
  if (!screen) return null;

  const settings = parseScreenSettings(screen.settings);
  const { currency, timeZone, chartRange } = settings;
  const accounts = await linkedAccounts(screen.id);
  const accountIds = accounts.map((account) => account.id);
  const calendar = displayCalendar(calendarDay(now, timeZone));
  // MRR history covers the chart and "30 days ago": all time reads the whole ledger, since the
  // first movement starts the chart. Revenue covers this month and the previous one.
  const movementsFrom =
    chartRange === "all"
      ? null
      : earliestDay(chartStart(calendar.today, chartRange), calendar.thirtyDaysAgo);

  const [totals, payingCustomers, movements, revenue, newCustomers, createdToday, activity] =
    accountIds.length
      ? await Promise.all([
          subscriptionTotals(accountIds),
          payingCustomerCounts(accountIds),
          movementsByDay(accountIds, timeZone, movementsFrom),
          revenueByDay(accountIds, timeZone, calendar.previousMonthStart),
          newCustomerCounts(accountIds, timeZone, calendar.monthStart),
          customersCreatedSince(accountIds, timeZone, calendar.today),
          feedActivity(accountIds, settings),
        ])
      : [[], new Map(), [], [], new Map(), new Map(), []];

  const converter = await createCurrencyConverter(
    currency,
    // New customers bring no amount, hence no currency.
    [...totals, ...movements, ...revenue, ...activity].flatMap((row) => row.currency ?? []),
    { now, source: rateSource },
  );
  const figures: AccountFigures = {
    subscriptions: totals.map((row) => ({
      accountId: row.accountId,
      mrr: converter.convert(row.mrr, row.currency) ?? 0,
      trialing: row.trialing,
    })),
    movements: convertDaily(movements, converter, calendar.today),
    revenue: convertDaily(revenue, converter, calendar.today),
    payingCustomers,
    newCustomers,
    customersCreatedToday: createdToday,
  };
  const metricsOfAccounts = (includes: (accountId: string) => boolean) =>
    metricsOf(figures, includes, calendar, chartRange);
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));

  return {
    version: BUILD_ID,
    generatedAt: now.toISOString(),
    screen: { name: screen.name, settings },
    currency,
    status: displayStatus(accounts.map((account) => account.status)),
    accounts: accounts.map(({ id, name, status, livemode }) => ({ id, name, status, livemode })),
    ...metricsOfAccounts(() => true),
    // Filled whether the screen rotates or not, so that its editor previews either at once. A
    // single account's numbers are the screen's own.
    views:
      accounts.length > 1
        ? accounts
            .filter((account) => account.status === "ready")
            .map((account) => ({
              accountId: account.id,
              ...metricsOfAccounts((accountId) => accountId === account.id),
            }))
        : [],
    feed: activity.flatMap((row) => {
      const item = toFeedItem(row, converter, settings, accountNames.get(row.accountId) ?? "");
      return item ? [item] : [];
    }),
    testEvent: recentTestEvent(screen.testEventAt, now),
    personalizedVoice: settings.voice.enabled && settings.voice.personalized && canSynthesize(),
    warnings: displayWarnings(converter.unavailable, accounts),
  };
}

/**
 * The latest activity, for displays to play what just happened, and enough of the events the
 * screen shows in its feed to fill it when it leaves frequent ones out (payments made for Stripe
 * Connect accounts, often): newest first.
 */
async function feedActivity(accountIds: string[], settings: ScreenSettings) {
  const shown = new Set(FEED_EVENTS.filter((event) => settings.events[event].feed));
  if (shown.size === FEED_EVENTS.length) return latestActivity(accountIds, FEED_LENGTH);
  const [latest, feed] = await Promise.all([
    latestActivity(accountIds, FEED_LENGTH),
    latestActivity(accountIds, FEED_LENGTH, shown),
  ]);
  const rows = new Map([...latest, ...feed].map((row) => [`${row.source}:${row.id}`, row]));
  return [...rows.values()].sort(newestFirst);
}

/** Daily amounts in the screen currency, without those that cannot be converted. */
function convertDaily<T extends { amount: number; currency: string; day: string }>(
  rows: readonly T[],
  converter: CurrencyConverter,
  today: string,
): T[] {
  return rows.flatMap((row) => {
    const amount = converter.convert(row.amount, row.currency);
    // A movement dated in the future (clock drift) counts today.
    const day = row.day > today ? today : row.day;
    return amount === null ? [] : [{ ...row, day, amount }];
  });
}

/** The test celebration displays should play, while it is recent. */
function recentTestEvent(testEventAt: Date | null, now: Date): DisplayState["testEvent"] {
  if (!testEventAt || now.getTime() - testEventAt.getTime() > TEST_EVENT_TTL_MS) return null;
  return { id: testEventAt.toISOString() };
}

/** Issues worth a discreet line on the screen: missing exchange rates, failing accounts. */
function displayWarnings(
  unconvertedCurrencies: ReadonlySet<string>,
  accounts: readonly { name: string; status: string }[],
): DisplayWarning[] {
  return [
    ...[...unconvertedCurrencies].map((currency): DisplayWarning => ({
      kind: "unconverted-currency",
      currency,
    })),
    ...accounts
      .filter((account) => account.status === "error")
      .map((account): DisplayWarning => ({ kind: "failing-account", accountName: account.name })),
  ];
}

function toFeedItem(
  row: ActivityRow,
  converter: CurrencyConverter,
  settings: ScreenSettings,
  accountName: string,
): FeedItem | null {
  // A new customer has no amount to convert.
  const amount = row.currency === null ? 0 : converter.convert(row.amount, row.currency);
  if (amount === null) return null;
  return {
    id: `${row.source}:${row.id}`,
    kind: row.kind,
    amount,
    original:
      row.currency === null || row.currency === settings.currency
        ? null
        : { amount: row.amount, currency: row.currency },
    occurredAt: row.occurredAt.toISOString(),
    live: row.origin === "live",
    customerKey: row.customerId && customerKey(row.accountId, row.customerId),
    // The screen URL may be seen by visitors: names only appear when the founder allows it, and
    // emails, masked here when asked, only for customers without a name.
    customerName: settings.showCustomerNames ? row.customerName : null,
    customerEmail:
      settings.showCustomerNames && row.customerName === null
        ? shownEmail(row.customerEmail, settings.customerEmails)
        : null,
    country: row.country,
    planName: row.planName,
    connect:
      row.connectedAccountId === null || row.currency === null
        ? null
        : {
            applicationFee:
              row.applicationFee === null
                ? null
                : converter.convert(row.applicationFee, row.currency),
          },
    churn:
      row.kind === "churn" && row.churnReason !== null
        ? { reason: row.churnReason, endsAt: row.endsAt?.toISOString() ?? null }
        : null,
    accountId: row.accountId,
    accountName,
  };
}

/**
 * Tells a display which items belong to the same customer, e.g. a new subscription and its first
 * payment, without handing out their Stripe id: anyone with a screen's link reads its state.
 */
function customerKey(accountId: string, customerId: string): string {
  return createHash("sha256").update(`${accountId}:${customerId}`).digest("base64url").slice(0, 16);
}
