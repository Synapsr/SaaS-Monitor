import "server-only";
import type { DisplayCalendar } from "@/lib/display/calendar";
import type {
  DisplayMetrics,
  DisplayState,
  MrrMovementKind,
  SeriesPoint,
} from "@/lib/display/types";

/** An amount in the screen currency, on a calendar day of the screen's time zone. */
export interface DayAmount {
  day: string;
  amount: number;
}

export interface MovementAmount extends DayAmount {
  kind: MrrMovementKind;
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
): { revenue: DisplayMetrics["revenue"]; series: SeriesPoint[] } {
  const byDay = totalsByDay(daily);
  const between = (from: string, to: string) =>
    [...byDay].reduce(
      (total, [day, amount]) => (day >= from && day <= to ? total + amount : total),
      0,
    );
  return {
    revenue: {
      today: byDay.get(calendar.today) ?? 0,
      yesterday: byDay.get(calendar.yesterday) ?? 0,
      monthToDate: between(calendar.monthStart, calendar.today),
      previousMonthToDate: between(calendar.previousMonthStart, calendar.previousMonthCutoff),
      last30Days: between(calendar.revenueDays[0], calendar.today),
    },
    series: calendar.revenueDays.map((date) => ({ date, value: byDay.get(date) ?? 0 })),
  };
}

export function movementTotals(
  movements: readonly MovementAmount[],
  since: string,
): Omit<DisplayMetrics["thisMonth"], "newCustomers" | "churnedCustomers"> {
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
