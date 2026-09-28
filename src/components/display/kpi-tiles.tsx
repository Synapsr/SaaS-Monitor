import NumberFlow from "@number-flow/react";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { calendarDay, displayCalendar } from "@/lib/display/calendar";
import { formatAmount, formatPercent, moneyFlow, percentChange } from "@/lib/display/format";
import { formatMonth } from "@/lib/display/time";
import type { DisplayMetrics } from "@/lib/display/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

interface KpiTilesProps {
  metrics: DisplayMetrics;
  currency: string;
  timeZone: string;
  now: number;
}

/** The four numbers worth a glance: today, this month, customers and net new MRR. */
export function KpiTiles({ metrics, currency, timeZone, now }: KpiTilesProps) {
  const { revenue, thisMonth } = metrics;
  const calendar = displayCalendar(calendarDay(new Date(now), timeZone));
  const previousMonth = formatMonth(calendar.previousMonthStart);
  const monthChange = percentChange(revenue.monthToDate, revenue.previousMonthToDate);
  const gained = thisMonth.new + thisMonth.expansion + thisMonth.reactivation;
  const lost = thisMonth.contraction + thisMonth.churn;

  return (
    <dl className="grid grid-cols-4 gap-5 portrait:grid-cols-2">
      <Tile
        label="Revenue today"
        value={<NumberFlow {...moneyFlow(revenue.today, currency)} />}
        characters={formatMoney(revenue.today, currency).length}
      >
        {formatAmount(revenue.yesterday, currency)} yesterday
      </Tile>
      <Tile
        label="This month"
        value={<NumberFlow {...moneyFlow(revenue.monthToDate, currency)} />}
        characters={formatMoney(revenue.monthToDate, currency).length}
      >
        {monthChange === null ? (
          `vs ${formatAmount(0, currency)} in ${previousMonth}`
        ) : (
          <Change ratio={monthChange}>vs {previousMonth}</Change>
        )}
      </Tile>
      <Tile
        label="Customers"
        value={<NumberFlow value={metrics.activeCustomers} locales="en-US" />}
        characters={metrics.activeCustomers.toLocaleString("en-US").length}
      >
        {[
          thisMonth.newCustomers > 0 && `+${thisMonth.newCustomers} this month`,
          metrics.trialingSubscriptions > 0 && `${metrics.trialingSubscriptions} in trial`,
        ]
          .filter(Boolean)
          .join(" · ") || "Paying customers"}
      </Tile>
      <Tile
        label="Net new MRR"
        value={<NumberFlow {...moneyFlow(thisMonth.net, currency, { signed: true })} />}
        characters={formatMoney(thisMonth.net, currency, { signed: true }).length}
      >
        {formatAmount(gained, currency, { signed: true })} gained ·{" "}
        {formatAmount(lost, currency, { signed: true })} lost
      </Tile>
    </dl>
  );
}

interface TileProps {
  label: string;
  value: ReactNode;
  /** Length of the formatted value: big amounts shrink to stay inside the tile. */
  characters: number;
  children: ReactNode;
}

function Tile({ label, value, characters, children }: TileProps) {
  return (
    <div className="@container flex min-w-0 flex-col gap-2 rounded-3xl bg-(--surface) px-7 py-6 ring-1 ring-(--hairline) portrait:gap-1 portrait:py-5">
      <dt className="text-lg text-(--ink-2)">{label}</dt>
      <dd
        style={{ "--characters": characters } as CSSProperties}
        className="flex h-[calc(var(--text-5xl)*1.25)] items-center text-[length:min(var(--text-5xl),calc(100cqi/(var(--characters)*0.6)))] font-semibold tracking-tight"
      >
        {value}
      </dd>
      <dd className="truncate text-base text-(--ink-3)">{children}</dd>
    </div>
  );
}

function Change({ ratio, children }: { ratio: number; children: ReactNode }) {
  const Icon = ratio >= 0 ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium tabular-nums",
          ratio >= 0 ? "text-(--glow-bright)" : "text-(--ink-2)",
        )}
      >
        <Icon aria-hidden className="size-[1.15em]" />
        {formatPercent(ratio, { signed: true })}
      </span>
      {children}
    </span>
  );
}
