import { Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { KindIcon } from "@/components/display/feed-kind-icon";
import { useNow } from "@/hooks/use-now";
import { isGoodNews, itemAmount, itemContext, KIND_LABELS } from "@/lib/display/feed";
import { formatPayment } from "@/lib/display/format";
import { formatFeedTime } from "@/lib/display/time";
import type { FeedItem } from "@/lib/display/types";
import { cn } from "@/lib/utils";

/** More than a screen can show: the rest fades out at the bottom. */
const MAX_ITEMS = 14;

interface LiveFeedProps {
  feed: FeedItem[];
  currency: string;
  timeZone: string;
  serverTime: number;
  showAccount: boolean;
  warnings: string[];
  className?: string;
}

export function LiveFeed({
  feed,
  currency,
  timeZone,
  serverTime,
  showAccount,
  warnings,
  className,
}: LiveFeedProps) {
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
        Latest activity
      </h2>
      <div
        role="log"
        aria-live="polite"
        className="relative min-h-0 flex-1 overflow-hidden mask-b-from-80% mask-b-to-100%"
      >
        {items.length === 0 ? (
          <p className="px-8 py-6 text-xl text-pretty text-(--ink-3)">
            New payments and subscriptions will appear here the moment they happen.
          </p>
        ) : (
          <ol className="flex flex-col px-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <FeedRow
                  key={item.id}
                  item={item}
                  currency={currency}
                  relativeTime={formatFeedTime(new Date(item.occurredAt), new Date(now), timeZone)}
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
          <Info aria-hidden className="mt-0.5 size-[1.1em] shrink-0" />
          <span className="line-clamp-2">{warnings[0]}</span>
        </p>
      )}
    </section>
  );
}

interface FeedRowProps {
  item: FeedItem;
  currency: string;
  relativeTime: string;
  showAccount: boolean;
  arrived: boolean;
}

function FeedRow({ item, currency, relativeTime, showAccount, arrived }: FeedRowProps) {
  const payment = item.kind === "payment";
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
      <KindIcon kind={item.kind} className="size-12" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <p className="flex items-baseline gap-2 truncate">
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums",
                !isGoodNews(item.kind) && "text-(--ink-2)",
              )}
            >
              {itemAmount(item, currency)}
            </span>
            {!payment && <span className="text-base font-medium text-(--ink-3)">MRR</span>}
            {item.original && (
              <span className="text-base text-(--ink-3)">
                {formatPayment(item.original.amount, item.original.currency)}
              </span>
            )}
          </p>
          <p className="shrink-0 text-base whitespace-nowrap text-(--ink-3)">{relativeTime}</p>
        </div>
        <p className="truncate text-lg text-(--ink-2)">
          {[KIND_LABELS[item.kind], ...itemContext(item, { showAccount })].join(" · ")}
        </p>
      </div>
    </motion.li>
  );
}
