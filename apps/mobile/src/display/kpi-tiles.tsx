import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { calendarDay, displayCalendar } from "@/contract/display/calendar";
import { formatAmount, formatPercent, percentChange } from "@/contract/display/format";
import type { RecurringMetric } from "@/contract/display/metric";
import { formatMonth } from "@/contract/display/time";
import type { DisplayMetrics } from "@/contract/display/types";
import { formatMoney } from "@/contract/money";
import { useDisplay } from "@/display/context";
import { DisplayText } from "@/display/text";
import { Shareable } from "@/share/shareable";
import type { TileKey } from "@/share/subjects";

interface KpiTilesProps {
  metrics: DisplayMetrics;
  /** Net new MRR, or ARR: revenue is cash received, the same whatever the screen's metric. */
  recurring: RecurringMetric;
  currency: string;
  timeZone: string;
  now: number;
  /** One of them alone, for an image of it. */
  only?: TileKey;
}

/**
 * The four numbers worth a glance: today, this month, customers and net new MRR (or ARR). Touch
 * and hold one to share it.
 */
export function KpiTiles({ metrics, recurring, currency, timeZone, now, only }: KpiTilesProps) {
  const { locale: displayLocale, scale, layout } = useDisplay();
  const { locale, text } = displayLocale;
  const { revenue, thisMonth } = metrics;
  const calendar = displayCalendar(calendarDay(new Date(now), timeZone));
  const previousMonth = formatMonth(calendar.previousMonthStart, locale);
  const amount = (value: number) => formatAmount(value, currency, locale);
  const monthChange = percentChange(revenue.monthToDate, revenue.previousMonthToDate);
  const net = recurring.fromMrr(thisMonth.net);
  const gained = recurring.fromMrr(thisMonth.new + thisMonth.expansion + thisMonth.reactivation);
  const lost = recurring.fromMrr(thisMonth.contraction + thisMonth.churn);
  const customers =
    [
      thisMonth.newCustomers > 0 && text.tiles.newThisMonth(thisMonth.newCustomers),
      metrics.trialingSubscriptions > 0 && text.tiles.inTrial(metrics.trialingSubscriptions),
    ]
      .filter(Boolean)
      .join(" · ") || text.tiles.paying;

  const contents: Record<TileKey, TileProps> = {
    today: {
      label: text.tiles.revenueToday,
      value: formatMoney(revenue.today, currency, { locale }),
      details: text.tiles.yesterday(amount(revenue.yesterday)),
    },
    month: {
      label: text.tiles.thisMonth,
      value: formatMoney(revenue.monthToDate, currency, { locale }),
      details:
        monthChange === null ? (
          text.tiles.versusAmount(amount(0), previousMonth)
        ) : (
          <Change ratio={monthChange}>{text.tiles.versus(previousMonth)}</Change>
        ),
    },
    customers: {
      label: text.tiles.customers,
      value: metrics.activeCustomers.toLocaleString(locale),
      details: customers,
    },
    net: {
      label: text.tiles.netNew(recurring.label),
      value: formatMoney(net, currency, { signed: true, locale }),
      // The words carry the signs: amounts twelve times larger in ARR still fit the tile.
      details: text.tiles.gainedLost(amount(gained), amount(Math.abs(lost))),
    },
  };

  if (only) return <Tile {...contents[only]} />;
  const tiles = TILES.map((key) => (
    // Each takes its share of the row; the tile fills it, as tall as the tallest.
    <Shareable key={key} subject={{ kind: "tile", tile: key }} style={{ flex: 1, minWidth: 0 }}>
      <Tile {...contents[key]} />
    </Shareable>
  ));

  const gap = (layout === "wall" ? 8 : 10) * scale;
  if (layout === "wall") {
    return <View style={{ flexDirection: "row", gap }}>{tiles}</View>;
  }
  return (
    <View style={{ gap }}>
      <View style={{ flexDirection: "row", gap }}>{tiles.slice(0, 2)}</View>
      <View style={{ flexDirection: "row", gap }}>{tiles.slice(2)}</View>
    </View>
  );
}

const TILES: readonly TileKey[] = ["today", "month", "customers", "net"];

interface TileProps {
  label: string;
  value: string;
  details: ReactNode;
}

function Tile({ label, value, details }: TileProps) {
  const { palette, scale, layout } = useDisplay();
  const [width, setWidth] = useState(0);
  const wall = layout === "wall";
  const maxSize = (wall ? 21 : 26) * scale;
  // Big amounts shrink to stay inside the tile.
  const size = width > 0 ? Math.min(maxSize, width / (value.length * 0.6)) : maxSize;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{
        flexGrow: 1,
        gap: (wall ? 2 : 4) * scale,
        paddingHorizontal: (wall ? 12 : 16) * scale,
        paddingVertical: (wall ? 10 : 14) * scale,
        borderRadius: (wall ? 16 : 20) * scale,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.hairline,
      }}
    >
      <DisplayText size={wall ? 10.5 : 13} tone="ink2" numberOfLines={1}>
        {label}
      </DisplayText>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ height: maxSize * 1.25, justifyContent: "center" }}
      >
        <DisplayText
          size={size / scale}
          weight="600"
          tabular
          tracking={-0.02}
          numberOfLines={1}
          maxFontSizeMultiplier={1}
        >
          {value}
        </DisplayText>
      </View>
      {/* Two lines at most, one on a wall that must fit: languages need more words, currencies more letters. */}
      <DisplayText size={wall ? 9.5 : 12} tone="ink3" numberOfLines={wall ? 1 : 2}>
        {details}
      </DisplayText>
    </View>
  );
}

/** "↗ +12% vs August": icons can't sit inside wrapped text, arrows can. */
function Change({ ratio, children }: { ratio: number; children: ReactNode }) {
  const { locale: displayLocale, layout } = useDisplay();
  const size = layout === "wall" ? 9.5 : 12;
  return (
    <>
      <DisplayText size={size} weight="500" tone={ratio >= 0 ? "glowInk" : "ink2"} tabular>
        {ratio >= 0 ? "↗ " : "↘ "}
        {formatPercent(ratio, displayLocale.locale, { signed: true })}
      </DisplayText>{" "}
      {children}
    </>
  );
}
