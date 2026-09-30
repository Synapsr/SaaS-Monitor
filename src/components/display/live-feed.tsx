import { InfoIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { KindIcon } from "@/components/display/feed-kind-icon";
import { useDisplayLocale } from "@/hooks/use-display-locale";
import { useNow } from "@/hooks/use-now";
import { customerLabel } from "@/lib/display/customer";
import {
  isGoodNews,
  itemAmount,
  itemKindLabel,
  itemOriginalAmount,
  warningText,
} from "@/lib/display/feed";
import { countryFlag, countryName } from "@/lib/display/format";
import type { RecurringMetric } from "@/lib/display/metric";
import { formatFeedTime } from "@/lib/display/time";
import type { DisplayWarning, FeedItem } from "@/lib/display/types";
import { cn } from "@/lib/utils";

/** More than a screen can show: the rest fades out at the bottom. */
const MAX_ITEMS = 14;

interface LiveFeedProps {
  feed: FeedItem[];
  /** Subscription changes read "+$149 MRR", or "+$1,788 ARR". */
  recurring: RecurringMetric;
  currency: string;
  timeZone: string;
  serverTime: number;
  showAccount: boolean;
  warnings: DisplayWarning[];
  className?: string;
}

export function LiveFeed({
  feed,
  recurring,
  currency,
  timeZone,
  serverTime,
  showAccount,
  warnings,
  className,
}: LiveFeedProps) {
  const displayLocale = useDisplayLocale();
  const { text } = displayLocale;
  const now = useNow(serverTime, 15_000);
  // Items already there when the screen opened never glow: only what happens next does.
  const [initialIds] = useState(() => new Set(feed.map((item) => item.id)));
  const items = feed.slice(0, MAX_ITEMS);

  return (
    <section
      aria-labelledby="feed-title"
      className={cn(
        "flex min-h-0 flex-col rounded-4xl bg-(--surface) ring-1 ring-(--hairline)",
        className,
      )}
    >
      <h2 id="feed-title" className="px-8 pt-7 pb-3 text-xl font-medium text-(--ink-2)">
        {text.feed.title}
      </h2>
      <div
        role="log"
        aria-live="polite"
        className="relative min-h-0 flex-1 overflow-hidden mask-b-from-80% mask-b-to-100%"
      >
        {items.length === 0 ? (
          <p className="px-8 py-6 text-xl text-pretty text-(--ink-3)">{text.feed.empty}</p>
        ) : (
          <ol className="flex flex-col px-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <FeedRow
                  key={item.id}
                  item={item}
                  recurring={recurring}
                  currency={currency}
                  relativeTime={formatFeedTime(
                    new Date(item.occurredAt),
                    new Date(now),
                    timeZone,
                    displayLocale,
                  )}
                  showAccount={showAccount}
                  arrived={item.live && !initialIds.has(item.id)}
                />
              ))}
            </AnimatePresence>
          </ol>
        )}
      </div>
      {warnings.length > 0 && (
        <p className="flex items-start gap-2.5 border-t border-(--hairline) px-8 py-4 text-base text-(--ink-3)">
          <InfoIcon aria-hidden className="mt-0.5 size-[1.1em] shrink-0" />
          <span className="line-clamp-2">{warningText(warnings[0], text)}</span>
        </p>
      )}
    </section>
  );
}

interface FeedRowProps {
  item: FeedItem;
  recurring: RecurringMetric;
  currency: string;
  relativeTime: string;
  showAccount: boolean;
  arrived: boolean;
}

function FeedRow({ item, recurring, currency, relativeTime, showAccount, arrived }: FeedRowProps) {
  const { language, locale, text } = useDisplayLocale();
  const amount = itemAmount(item, currency, recurring, locale);
  const original = itemOriginalAmount(item, recurring, locale);
  const kind = itemKindLabel(item, text);
  const customer = customerLabel(item);
  // A new customer has no amount: their name leads, or what they are when it is hidden.
  const headline = amount ?? customer ?? kind;
  // The column is narrow: a flag stands for the country, and the account moves up by the time.
  const country = item.country && countryName(item.country, language);
  const flag = countryFlag(item.country);
  const details = [
    headline === kind ? null : kind,
    amount === null ? null : customer,
    item.planName,
  ].filter((part): part is string => Boolean(part));
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: -16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ type: "spring", duration: 0.7, bounce: 0.15 }}
      className={cn(
        "flex items-center gap-5 rounded-2xl px-4 py-3.5",
        arrived && "motion-safe:animate-[display-arrival_5s_ease-out]",
      )}
    >
      <KindIcon item={item} className="size-12" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <p className="flex items-baseline gap-2 truncate">
            <span
              className={cn(
                "truncate text-2xl font-semibold tabular-nums",
                !isGoodNews(item.kind) && "text-(--ink-2)",
              )}
            >
              {headline}
            </span>
            {amount !== null && item.kind !== "payment" && (
              <span className="text-base font-medium text-(--ink-3)">{recurring.label}</span>
            )}
            {original && <span className="text-base text-(--ink-3)">{original}</span>}
          </p>
          <p className="flex shrink-0 items-baseline gap-2 text-base whitespace-nowrap text-(--ink-3)">
            {showAccount && (
              <>
                <span className="max-w-[calc(var(--rem)*10)] truncate">{item.accountName}</span>
                <span aria-hidden>·</span>
              </>
            )}
            {relativeTime}
          </p>
        </div>
        <p className="truncate text-lg text-(--ink-2)">
          {flag && (
            <span aria-hidden className="mr-2">
              {flag}
            </span>
          )}
          {/* Without other details, the country is worth its name. */}
          {details.length > 0 ? (
            <>
              {country && <span className="sr-only">{country} · </span>}
              {details.join(" · ")}
            </>
          ) : (
            country
          )}
        </p>
      </div>
    </motion.li>
  );
}
