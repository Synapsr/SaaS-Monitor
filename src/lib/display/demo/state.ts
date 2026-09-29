import { BUILD_ID } from "@/lib/build-id";
import {
  calendarDay,
  chartDays,
  daysInRange,
  displayCalendar,
  monthOf,
} from "@/lib/display/calendar";
import {
  BUSINESS_NAME,
  DEMO_ACCOUNT_ID,
  DEMO_CURRENCY,
  DEMO_GOAL,
} from "@/lib/display/demo/business";
import { EMPTY_MONTH, mrrAt, type DemoWorld } from "@/lib/display/demo/simulation";
import { recurringMetric } from "@/lib/display/metric";
import type { DisplayState, SeriesPoint } from "@/lib/display/types";
import { defaultScreenSettings } from "@/lib/screens/settings";

/*
 * What a real screen showing the demo's world would receive from the server: the demo renders
 * with the same display as every screen.
 */

/** The first day of the history the demo remembers: its all-time chart starts there. */
function firstDay(world: DemoWorld): string | null {
  return Object.keys(world.mrrByDay).sort()[0] ?? null;
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

/** The `DisplayState` a real screen showing this world would receive at `now`. */
export function demoState(world: DemoWorld, now: Date): DisplayState {
  const { options } = world;
  const today = calendarDay(now, options.timeZone);
  const calendar = displayCalendar(today);
  const revenueOn = (day: string) => world.revenueByDay[day] ?? 0;
  const revenueBetween = (from: string, to: string) =>
    daysInRange(from, to).reduce((sum, day) => sum + revenueOn(day), 0);
  const customers = world.customers.length;

  return {
    version: BUILD_ID,
    generatedAt: now.toISOString(),
    screen: {
      name: BUSINESS_NAME,
      settings: {
        ...defaultScreenSettings,
        currency: DEMO_CURRENCY,
        timeZone: options.timeZone,
        metric: options.metric,
        // The same goal in the metric shown: $15K of MRR is $180K of ARR.
        goal: recurringMetric(options.metric).fromMrr(DEMO_GOAL),
        sound: {
          ...defaultScreenSettings.sound,
          enabled: options.soundPack !== null,
          pack: options.soundPack ?? defaultScreenSettings.sound.pack,
        },
        showCustomerNames: options.showCustomerNames,
        chartRange: options.chartRange,
        accent: options.accent,
      },
    },
    currency: DEMO_CURRENCY,
    status: "ready",
    accounts: [{ id: DEMO_ACCOUNT_ID, name: BUSINESS_NAME, status: "ready", livemode: true }],
    metrics: {
      mrr: world.mrr,
      mrr30DaysAgo: mrrAt(world.mrrByDay, calendar.thirtyDaysAgo),
      arr: world.mrr * 12,
      activeCustomers: customers,
      trialingSubscriptions: world.trials,
      arpu: customers > 0 ? Math.round(world.mrr / customers) : 0,
      customersCreatedToday: 0,
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
    series: {
      mrr: mrrSeries(world.mrrByDay, chartDays(today, options.chartRange, firstDay(world))),
    },
    views: [],
    feed: world.feed.map((item) =>
      options.showCustomerNames ? item : { ...item, customerName: null },
    ),
    testEvent: null,
    warnings: [],
  };
}
