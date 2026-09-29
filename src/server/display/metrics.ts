import "server-only";
import { chartDays, daysInRange, type DisplayCalendar } from "@/lib/display/calendar";
import type {
  AccountView,
  DisplayMetrics,
  DisplayState,
  MrrMovementKind,
  SeriesPoint,
} from "@/lib/display/types";
import type { ChartRange } from "@/lib/screens/settings";

/** An amount in the screen currency, on a calendar day of the screen's time zone. */
export interface DayAmount {
  day: string;
  amount: number;
}

export interface MovementAmount extends DayAmount {
  kind: MrrMovementKind;
}

interface OfAccount {
  accountId: string;
}

/**
 * What the numbers of a screen are made of, account by account, amounts in the screen currency.
 * Counts are keyed by account.
 */
export interface AccountFigures {
  /** Current MRR and trials. */
  subscriptions: readonly (OfAccount & { mrr: number; trialing: number })[];
  movements: readonly (OfAccount & MovementAmount)[];
  revenue: readonly (OfAccount & DayAmount)[];
  /** Customers with a paying subscription. */
  payingCustomers: ReadonlyMap<string, number>;
  /** Customers who started paying this month. */
  newCustomers: ReadonlyMap<string, number>;
  customersCreatedToday: ReadonlyMap<string, number>;
}

/**
 * The metrics and chart of the accounts `includes` accepts: all of a screen's, or one of them for
 * its view of that account. Every figure but ARPU adds up across accounts, so the screen's are
 * the sums of its accounts'.
 */
export function metricsOf(
  figures: AccountFigures,
  includes: (accountId: string) => boolean,
  calendar: DisplayCalendar,
  chartRange: ChartRange,
): Pick<AccountView, "metrics" | "series"> {
  const rows = <Row extends OfAccount>(all: readonly Row[]) =>
    all.filter((row) => includes(row.accountId));
  const total = (counts: ReadonlyMap<string, number>) =>
    [...counts].reduce((sum, [accountId, count]) => (includes(accountId) ? sum + count : sum), 0);

  const subscriptions = rows(figures.subscriptions);
  const mrrChanges = rows(figures.movements);
  const mrr = subscriptions.reduce((sum, row) => sum + row.mrr, 0);
  const chart = chartDays(
    calendar.today,
    chartRange,
    chartRange === "all" ? firstDay(mrrChanges) : null,
  );
  const historyStart = earliestDay(chart[0], calendar.thirtyDaysAgo);
  const history = new Map(
    mrrHistory(mrr, mrrChanges, daysInRange(historyStart, calendar.today)).map((point) => [
      point.date,
      point.value,
    ]),
  );
  const payingCustomers = total(figures.payingCustomers);

  return {
    metrics: {
      mrr,
      mrr30DaysAgo: history.get(calendar.thirtyDaysAgo) ?? mrr,
      arr: mrr * 12,
      activeCustomers: payingCustomers,
      trialingSubscriptions: subscriptions.reduce((sum, row) => sum + row.trialing, 0),
      arpu: payingCustomers ? Math.round(mrr / payingCustomers) : 0,
      customersCreatedToday: total(figures.customersCreatedToday),
      revenue: revenueMetrics(rows(figures.revenue), calendar),
      thisMonth: {
        ...movementTotals(mrrChanges, calendar.monthStart),
        newCustomers: total(figures.newCustomers),
      },
    },
    series: {
      mrr: chart.map((date) => ({ date, value: history.get(date) ?? mrr })),
    },
  };
}

export function earliestDay(a: string, b: string): string {
  return a < b ? a : b;
}

/** The first day with an amount, e.g. the day an all-time chart starts: its first movement. */
export function firstDay(amounts: readonly DayAmount[]): string | null {
  let first: string | null = null;
  for (const { day } of amounts) {
    if (first === null || day < first) first = day;
  }
  return first;
}

function totalsByDay(amounts: readonly DayAmount[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const { day, amount } of amounts) totals.set(day, (totals.get(day) ?? 0) + amount);
  return totals;
}

/**
 * MRR at the end of each of `days` (consecutive, ending today). It walks back from the current
 * MRR, removing the changes of each day: only recent movements are read, and the last point is
 * exactly the headline MRR.
 */
export function mrrHistory(
  currentMrr: number,
  changes: readonly DayAmount[],
  days: readonly string[],
): SeriesPoint[] {
  const changesByDay = totalsByDay(changes);
  const points: SeriesPoint[] = [];
  let value = currentMrr;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    points.push({ date: days[index], value });
    value -= changesByDay.get(days[index]) ?? 0;
  }
  return points.reverse();
}

export function revenueMetrics(
  daily: readonly DayAmount[],
  calendar: DisplayCalendar,
): DisplayMetrics["revenue"] {
  const byDay = totalsByDay(daily);
  const between = (from: string, to: string) =>
    [...byDay].reduce(
      (total, [day, amount]) => (day >= from && day <= to ? total + amount : total),
      0,
    );
  return {
    today: byDay.get(calendar.today) ?? 0,
    yesterday: byDay.get(calendar.yesterday) ?? 0,
    monthToDate: between(calendar.monthStart, calendar.today),
    previousMonthToDate: between(calendar.previousMonthStart, calendar.previousMonthCutoff),
  };
}

export function movementTotals(
  movements: readonly MovementAmount[],
  since: string,
): Omit<DisplayMetrics["thisMonth"], "newCustomers"> {
  const totals: Record<MrrMovementKind, number> = {
    new: 0,
    expansion: 0,
    reactivation: 0,
    contraction: 0,
    churn: 0,
  };
  for (const movement of movements) {
    if (movement.day >= since) totals[movement.kind] += movement.amount;
  }
  const net = Object.values(totals).reduce((total, amount) => total + amount, 0);
  return { ...totals, net };
}

/** The screen is only in error when nothing works: one healthy account is worth showing. */
export function displayStatus(
  statuses: readonly ("importing" | "ready" | "error")[],
): DisplayState["status"] {
  if (!statuses.length) return "empty";
  if (statuses.every((status) => status === "error")) return "error";
  if (statuses.includes("importing")) return "importing";
  return "ready";
}
