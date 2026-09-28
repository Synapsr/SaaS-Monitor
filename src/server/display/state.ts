import "server-only";
import { z } from "zod";
import { BUILD_ID } from "@/lib/build-id";
import { calendarDay, chartDays, daysInRange, displayCalendar } from "@/lib/display/calendar";
import type { DisplayState, FeedItem } from "@/lib/display/types";
import { MINUTE_MS } from "@/lib/durations";
import { parseScreenSettings, type ScreenSettings } from "@/lib/screens/settings";
import { createCurrencyConverter, type CurrencyConverter, type RateSource } from "@/server/fx";
import { displayStatus, movementTotals, mrrHistory, revenueMetrics } from "./metrics";
import {
  findScreen,
  latestActivity,
  linkedAccounts,
  movementsByDay,
  newCustomerCount,
  payingCustomerCount,
  revenueByDay,
  subscriptionTotals,
  type FeedRow,
} from "./queries";

export interface DisplayStateOptions {
  now?: Date;
  /** Exchange rates source, for tests. */
  rateSource?: RateSource;
}

/** Screen links carry a 32-character token (`generatePublicToken`): longer is not worth a query. */
const tokenSchema = z.string().min(1).max(256);

const FEED_LENGTH = 20;
/** How long a "Send a test celebration" request stays visible to displays that poll. */
const TEST_EVENT_TTL_MS = 10 * MINUTE_MS;

const earliest = (a: string, b: string) => (a < b ? a : b);

/**
 * Everything a wall display shows, or `null` when no screen uses this token. The token comes
 * straight from a public URL: it is validated here, for the page and the polling endpoint alike.
 */
export async function getDisplayStateByToken(
  token: string,
  { now = new Date(), rateSource }: DisplayStateOptions = {},
): Promise<DisplayState | null> {
  if (!tokenSchema.safeParse(token).success) return null;
  const screen = await findScreen(token);
  if (!screen) return null;

  const settings = parseScreenSettings(screen.settings);
  const { currency, timeZone } = settings;
  const accounts = await linkedAccounts(screen.id);
  const accountIds = accounts.map((account) => account.id);
  const calendar = displayCalendar(calendarDay(now, timeZone));
  const chart = chartDays(calendar.today, settings.chartRange);
  // MRR history covers the chart and "30 days ago"; revenue this month and the previous one.
  const historyStart = earliest(chart[0], calendar.thirtyDaysAgo);

  const [totals, payingCustomers, movements, revenue, newCustomers, activity] = accountIds.length
    ? await Promise.all([
        subscriptionTotals(accountIds),
        payingCustomerCount(accountIds),
        movementsByDay(accountIds, timeZone, historyStart),
        revenueByDay(accountIds, timeZone, calendar.previousMonthStart),
        newCustomerCount(accountIds, timeZone, calendar.monthStart),
        latestActivity(accountIds, FEED_LENGTH),
      ])
    : [[], 0, [], [], 0, []];

  const converter = await createCurrencyConverter(
    currency,
    [...totals, ...movements, ...revenue, ...activity].map((row) => row.currency),
    { now, source: rateSource },
  );
  /** Daily amounts in the screen currency, without those that cannot be converted. */
  const inScreenCurrency = <T extends { amount: number; currency: string; day: string }>(
    rows: readonly T[],
  ) =>
    rows.flatMap((row) => {
      const amount = converter.convert(row.amount, row.currency);
      // A movement dated in the future (clock drift) counts today.
      const day = row.day > calendar.today ? calendar.today : row.day;
      return amount === null ? [] : [{ ...row, day, amount }];
    });

  const mrr = totals.reduce(
    (total, row) => total + (converter.convert(row.mrr, row.currency) ?? 0),
    0,
  );

  const mrrChanges = inScreenCurrency(movements);
  const history = new Map(
    mrrHistory(mrr, mrrChanges, daysInRange(historyStart, calendar.today)).map((point) => [
      point.date,
      point.value,
    ]),
  );
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));

  return {
    version: BUILD_ID,
    generatedAt: now.toISOString(),
    screen: { name: screen.name, settings },
    currency,
    status: displayStatus(accounts.map((account) => account.status)),
    accounts: accounts.map(({ id, name, status, livemode }) => ({ id, name, status, livemode })),
    metrics: {
      mrr,
      mrr30DaysAgo: history.get(calendar.thirtyDaysAgo) ?? mrr,
      arr: mrr * 12,
      activeCustomers: payingCustomers,
      trialingSubscriptions: totals.reduce((total, row) => total + row.trialing, 0),
      arpu: payingCustomers ? Math.round(mrr / payingCustomers) : 0,
      revenue: revenueMetrics(inScreenCurrency(revenue), calendar),
      thisMonth: { ...movementTotals(mrrChanges, calendar.monthStart), newCustomers },
    },
    series: {
      mrr: chart.map((date) => ({ date, value: history.get(date) ?? mrr })),
    },
    feed: activity.flatMap((row) => {
      const item = toFeedItem(row, converter, settings, accountNames.get(row.accountId) ?? "");
      return item ? [item] : [];
    }),
    testEvent:
      screen.testEventAt && now.getTime() - screen.testEventAt.getTime() <= TEST_EVENT_TTL_MS
        ? { id: screen.testEventAt.toISOString() }
        : null,
    warnings: [
      ...[...converter.unavailable].map(
        (code) =>
          `Amounts in ${code.toUpperCase()} are left out: no exchange rate is available right now.`,
      ),
      ...accounts
        .filter((account) => account.status === "error")
        .map(
          (account) =>
            `${account.name}: ${account.lastError ?? "this Stripe account needs attention."}`,
        ),
    ],
  };
}

function toFeedItem(
  row: FeedRow,
  converter: CurrencyConverter,
  settings: ScreenSettings,
  accountName: string,
): FeedItem | null {
  const amount = converter.convert(row.amount, row.currency);
  if (amount === null) return null;
  return {
    id: `${row.source}:${row.id}`,
    kind: row.kind,
    amount,
    original:
      row.currency === settings.currency ? null : { amount: row.amount, currency: row.currency },
    occurredAt: row.occurredAt.toISOString(),
    live: row.origin === "live",
    // The screen URL may be seen by visitors: names only appear when the founder allows it.
    customerName: settings.showCustomerNames ? row.customerName : null,
    country: row.country,
    planName: row.planName,
    accountName,
  };
}
