import NumberFlow from "@number-flow/react";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useDisplayLocale } from "@/hooks/use-display-locale";
import { calendarDay, displayCalendar } from "@/lib/display/calendar";
import { formatAmount, formatPercent, moneyFlow, percentChange } from "@/lib/display/format";
import type { RecurringMetric } from "@/lib/display/metric";
import { formatMonth } from "@/lib/display/time";
import type { DisplayMetrics } from "@/lib/display/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

interface KpiTilesProps {
  metrics: DisplayMetrics;
  /** Net new MRR, or ARR: revenue is cash received, the same whatever the screen's metric. */
  recurring: RecurringMetric;
  currency: string;
  timeZone: string;
  now: number;
}

/** The four numbers worth a glance: today, this month, customers and net new MRR (or ARR). */
export function KpiTiles({ metrics, recurring, currency, timeZone, now }: KpiTilesProps) {
  const { locale, text } = useDisplayLocale();
  const { revenue, thisMonth } = metrics;
  const calendar = displayCalendar(calendarDay(new Date(now), timeZone));
  const previousMonth = formatMonth(calendar.previousMonthStart, locale);
  const amount = (value: number) => formatAmount(value, currency, locale);
  const monthChange = percentChange(revenue.monthToDate, revenue.previousMonthToDate);
  const net = recurring.fromMrr(thisMonth.net);
  const gained = recurring.fromMrr(thisMonth.new + thisMonth.expansion + thisMonth.reactivation);
  const lost = recurring.fromMrr(thisMonth.contraction + thisMonth.churn);

  return (
    <dl className="grid grid-cols-4 gap-5 portrait:grid-cols-2">
      <Tile
        label={text.tiles.revenueToday}
        value={<NumberFlow {...moneyFlow(revenue.today, currency, locale)} />}
        characters={formatMoney(revenue.today, currency, { locale }).length}
      >
        {text.tiles.yesterday(amount(revenue.yesterday))}
      </Tile>
      <Tile
        label={text.tiles.thisMonth}
        value={<NumberFlow {...moneyFlow(revenue.monthToDate, currency, locale)} />}
        characters={formatMoney(revenue.monthToDate, currency, { locale }).length}
      >
        {monthChange === null ? (
          text.tiles.versusAmount(amount(0), previousMonth)
        ) : (
          <Change ratio={monthChange} locale={locale}>
            {text.tiles.versus(previousMonth)}
          </Change>
        )}
      </Tile>
      <Tile
        label={text.tiles.customers}
        value={<NumberFlow value={metrics.activeCustomers} locales={locale} />}
        characters={metrics.activeCustomers.toLocaleString(locale).length}
      >
        {[
          thisMonth.newCustomers > 0 && text.tiles.newThisMonth(thisMonth.newCustomers),
          metrics.trialingSubscriptions > 0 && text.tiles.inTrial(metrics.trialingSubscriptions),
        ]
          .filter(Boolean)
          .join(" · ") || text.tiles.paying}
      </Tile>
      <Tile
        label={text.tiles.netNew(recurring.label)}
        value={<NumberFlow {...moneyFlow(net, currency, locale, { signed: true })} />}
        characters={formatMoney(net, currency, { signed: true, locale }).length}
      >
        {/* The words carry the signs: amounts twelve times larger in ARR still fit the tile. */}
        {text.tiles.gainedLost(amount(gained), amount(Math.abs(lost)))}
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

function Change({
  ratio,
  locale,
  children,
}: {
  ratio: number;
  locale: string;
  children: ReactNode;
}) {
  const Icon = ratio >= 0 ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium tabular-nums",
          ratio >= 0 ? "text-(--glow-ink)" : "text-(--ink-2)",
        )}
      >
        <Icon aria-hidden className="size-[1.15em]" />
        {formatPercent(ratio, locale, { signed: true })}
      </span>
      {children}
    </span>
  );
}
