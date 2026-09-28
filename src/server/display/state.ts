import "server-only";
import { BUILD_ID } from "@/lib/build-id";
import { MINUTE_MS } from "@/lib/durations";
import type { DisplayAccount, DisplayState, FeedItem } from "@/lib/display/types";
import { parseScreenSettings, type ScreenSettings } from "@/lib/screens/settings";
import { createCurrencyConverter, type CurrencyConverter, type RateSource } from "@/server/fx";
import { daysBetween, displayCalendar, localDate } from "./calendar";
import { displayStatus, movementTotals, mrrHistory, revenueMetrics } from "./metrics";
import {
  customerChanges,
  findScreen,
  latestActivity,
  linkedAccounts,
  movementsByDay,
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

const FEED_LENGTH = 20;
/** How long a "Send a test celebration" request stays visible to displays that poll. */
const TEST_EVENT_TTL_MS = 10 * MINUTE_MS;

const earliest = (a: string, b: string) => (a < b ? a : b);

/** Everything a wall display shows, or `null` when no screen uses this token. */
export async function getDisplayStateByToken(
  token: string,
  { now = new Date(), rateSource }: DisplayStateOptions = {},
): Promise<DisplayState | null> {
  const screen = await findScreen(token);
  if (!screen) return null;

  const settings = parseScreenSettings(screen.settings);
  const { currency, timeZone } = settings;
  const accounts = await linkedAccounts(screen.id);
  const accountIds = accounts.map((account) => account.id);
  const calendar = displayCalendar(localDate(now, timeZone), settings.chartRange);
  // MRR history covers the chart and "30 days ago"; revenue the last 30 days and last month.
  const historyStart = earliest(calendar.chartDays[0], calendar.thirtyDaysAgo);
  const revenueStart = earliest(calendar.revenueDays[0], calendar.previousMonthStart);

  const [totals, payingCustomers, movements, revenue, customers, activity] = accountIds.length
    ? await Promise.all([
        subscriptionTotals(accountIds),
        payingCustomerCount(accountIds),
        movementsByDay(accountIds, timeZone, historyStart),
        revenueByDay(accountIds, timeZone, revenueStart),
        customerChanges(accountIds, timeZone, calendar.monthStart),
        latestActivity(accountIds, FEED_LENGTH),
      ])
    : [[], 0, [], [], { newCustomers: 0, churnedCustomers: 0 }, []];

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

  const displayAccounts: DisplayAccount[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    status: account.status,
    livemode: account.livemode,
    mrr: totals
      .filter((row) => row.accountId === account.id)
      .reduce((total, row) => total + (converter.convert(row.mrr, row.currency) ?? 0), 0),
  }));
  const mrr = displayAccounts.reduce((total, account) => total + account.mrr, 0);

  const mrrChanges = inScreenCurrency(movements);
  const history = new Map(
    mrrHistory(mrr, mrrChanges, daysBetween(historyStart, calendar.today)).map((point) => [
      point.date,
      point.value,
    ]),
  );
  const { revenue: revenueTotals, series: revenueSeries } = revenueMetrics(
    inScreenCurrency(revenue),
    calendar,
  );
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));

  return {
    version: BUILD_ID,
    generatedAt: now.toISOString(),
    screen: { name: screen.name, settings },
    currency,
    status: displayStatus(accounts.map((account) => account.status)),
    accounts: displayAccounts,
    metrics: {
      mrr,
      mrr30DaysAgo: history.get(calendar.thirtyDaysAgo) ?? mrr,
      arr: mrr * 12,
      activeSubscriptions: totals.reduce((total, row) => total + row.paying, 0),
      activeCustomers: payingCustomers,
      trialingSubscriptions: totals.reduce((total, row) => total + row.trialing, 0),
      arpu: payingCustomers ? Math.round(mrr / payingCustomers) : 0,
      revenue: revenueTotals,
      thisMonth: { ...movementTotals(mrrChanges, calendar.monthStart), ...customers },
    },
    series: {
      mrr: calendar.chartDays.map((date) => ({ date, value: history.get(date) ?? mrr })),
      revenue: revenueSeries,
    },
    feed: activity.flatMap((row) => {
      const item = toFeedItem(row, converter, settings, accountNames.get(row.accountId) ?? "");
      return item ? [item] : [];
    }),
    testEvent:
      screen.testEventAt && now.getTime() - screen.testEventAt.getTime() <= TEST_EVENT_TTL_MS
        ? { id: screen.testEventAt.toISOString(), at: screen.testEventAt.toISOString() }
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
