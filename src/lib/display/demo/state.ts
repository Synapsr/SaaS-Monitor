import { BUILD_ID } from "@/lib/build-id";
import {
  calendarDay,
  chartDays,
  daysInRange,
  displayCalendar,
  monthOf,
} from "@/lib/display/calendar";
import { COMPANY_NAME, DEMO_CURRENCY, DEMO_GOAL } from "@/lib/display/demo/business";
import { EMPTY_MONTH, mrrAt, type DemoWorld } from "@/lib/display/demo/simulation";
import { recurringMetric } from "@/lib/display/metric";
import type { DisplayMetrics, DisplayState, SeriesPoint } from "@/lib/display/types";
import { defaultScreenSettings } from "@/lib/screens/settings";

/*
 * What a real screen showing the demo's world would receive from the server: the demo renders
 * with the same display as every screen.
 */

/** The first day of the history the demo remembers: its all-time chart starts there. */
function firstDay(worlds: readonly DemoWorld[]): string | null {
  return worlds.flatMap((world) => Object.keys(world.mrrByDay)).sort()[0] ?? null;
}

/** MRR at the end of each of `days`, oldest first, consecutive or sampled by week or month. */
function mrrSeries(mrrByDay: Readonly<Record<string, number>>, days: readonly string[]) {
  const changes = Object.keys(mrrByDay).sort();
  let next = 0;
  let value = mrrAt(mrrByDay, days[0]);
  return days.map((date): SeriesPoint => {
    for (; next < changes.length && changes[next] <= date; next += 1) {
      value = mrrByDay[changes[next]];
    }
    return { date, value };
  });
}

interface Numbers {
  metrics: DisplayMetrics;
  series: DisplayState["series"];
}

/** The numbers of one account on the chart's `days`. */
function worldNumbers(world: DemoWorld, now: Date, days: readonly string[]): Numbers {
  const today = calendarDay(now, world.options.timeZone);
  const calendar = displayCalendar(today);
  const revenueOn = (day: string) => world.revenueByDay[day] ?? 0;
  const revenueBetween = (from: string, to: string) =>
    daysInRange(from, to).reduce((sum, day) => sum + revenueOn(day), 0);
  const customers = world.customers.length;
  return {
    metrics: {
      mrr: world.mrr,
      mrr30DaysAgo: mrrAt(world.mrrByDay, calendar.thirtyDaysAgo),
      arr: world.mrr * 12,
      activeCustomers: customers,
      trialingSubscriptions: world.trials,
      arpu: customers > 0 ? Math.round(world.mrr / customers) : 0,
      customersCreatedToday: world.customersByDay[today] ?? 0,
      revenue: {
        today: revenueOn(today),
        yesterday: revenueOn(calendar.yesterday),
        monthToDate: revenueBetween(calendar.monthStart, today),
        previousMonthToDate: revenueBetween(
          calendar.previousMonthStart,
          calendar.previousMonthCutoff,
        ),
      },
      thisMonth: world.movementsByMonth[monthOf(today)] ?? EMPTY_MONTH,
    },
    series: { mrr: mrrSeries(world.mrrByDay, days) },
  };
}

/** The combined numbers of several accounts, like the server adds them up. */
function addUp(numbers: readonly Numbers[]): Numbers {
  const sum = (value: (metrics: DisplayMetrics) => number) =>
    numbers.reduce((total, { metrics }) => total + value(metrics), 0);
  const mrr = sum((metrics) => metrics.mrr);
  const activeCustomers = sum((metrics) => metrics.activeCustomers);
  const thisMonth = Object.fromEntries(
    Object.keys(EMPTY_MONTH).map((key) => [
      key,
      sum((metrics) => metrics.thisMonth[key as keyof DisplayMetrics["thisMonth"]]),
    ]),
  ) as DisplayMetrics["thisMonth"];
  return {
    metrics: {
      mrr,
      mrr30DaysAgo: sum((metrics) => metrics.mrr30DaysAgo),
      arr: mrr * 12,
      activeCustomers,
      trialingSubscriptions: sum((metrics) => metrics.trialingSubscriptions),
      arpu: activeCustomers > 0 ? Math.round(mrr / activeCustomers) : 0,
      customersCreatedToday: sum((metrics) => metrics.customersCreatedToday),
      revenue: {
        today: sum((metrics) => metrics.revenue.today),
        yesterday: sum((metrics) => metrics.revenue.yesterday),
        monthToDate: sum((metrics) => metrics.revenue.monthToDate),
        previousMonthToDate: sum((metrics) => metrics.revenue.previousMonthToDate),
      },
      thisMonth,
    },
    // Every account is charted on the same days.
    series: {
      mrr: numbers[0].series.mrr.map(({ date }, index) => ({
        date,
        value: numbers.reduce((total, { series }) => total + series.mrr[index].value, 0),
      })),
    },
  };
}

/** The `DisplayState` a real screen showing these accounts would receive at `now`. */
export function demoState(worlds: readonly DemoWorld[], now: Date): DisplayState {
  const { options } = worlds[0];
  const today = calendarDay(now, options.timeZone);
  const days = chartDays(today, options.chartRange, firstDay(worlds));
  const numbers = worlds.map((world) => worldNumbers(world, now, days));
  const several = worlds.length > 1;
  const total = several ? addUp(numbers) : numbers[0];

  return {
    version: BUILD_ID,
    generatedAt: now.toISOString(),
    screen: {
      name: several ? COMPANY_NAME : worlds[0].business.name,
      settings: {
        ...defaultScreenSettings,
        currency: DEMO_CURRENCY,
        timeZone: options.timeZone,
        metric: options.metric,
        // The same goal in the metric shown: $15K of MRR is $180K of ARR.
        goal: recurringMetric(options.metric).fromMrr(DEMO_GOAL * worlds.length),
        sound: {
          ...defaultScreenSettings.sound,
          enabled: options.soundPack !== null,
          pack: options.soundPack ?? defaultScreenSettings.sound.pack,
        },
        showCustomerNames: options.showCustomerNames,
        chartRange: options.chartRange,
        accent: options.accent,
        theme: options.theme,
        language: options.language,
        rotation: { ...defaultScreenSettings.rotation, enabled: options.rotation },
      },
    },
    currency: DEMO_CURRENCY,
    status: "ready",
    accounts: worlds.map(({ business }) => ({
      id: business.id,
      name: business.name,
      status: "ready",
      livemode: true,
    })),
    metrics: total.metrics,
    series: total.series,
    views: several
      ? worlds.map((world, index) => ({ accountId: world.business.id, ...numbers[index] }))
      : [],
    feed: worlds
      .flatMap((world) => world.feed)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .map((item) => (options.showCustomerNames ? item : { ...item, customerName: null })),
    testEvent: null,
    warnings: [],
  };
}
