import {
  CalendarXIcon,
  CircleDollarSignIcon,
  CirclePauseIcon,
  createLucideIcon,
  CreditCardXIcon,
  RotateCcwIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserMinusIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import { isGoodNews } from "@/lib/display/feed";
import type { ChurnReason, FeedItem, FeedItemKind } from "@/lib/display/types";
import { cn } from "@/lib/utils";

/** One icon per kind of activity, in the feed and in the moments that announce it. */
export const KIND_ICONS: Record<FeedItemKind, LucideIcon> = {
  payment: CircleDollarSignIcon,
  customer: UserPlusIcon,
  new: SparklesIcon,
  expansion: TrendingUpIcon,
  reactivation: RotateCcwIcon,
  contraction: TrendingDownIcon,
  churn: UserMinusIcon,
};

/** Why a subscription stopped counting, in place of the icon of a churn. */
export const CHURN_ICONS: Record<ChurnReason, LucideIcon> = {
  canceled: UserMinusIcon,
  scheduled: CalendarXIcon,
  unpaid: CreditCardXIcon,
  paused: CirclePauseIcon,
};

/**
 * A payment made for one of the account's Stripe Connect accounts: the payment's dollar, with an
 * arrow leaving its circle at the top right, as the money passes on. Drawn like Lucide's icons.
 */
export const CONNECT_PAYMENT_ICON = createLucideIcon("circle-dollar-out", [
  ["path", { d: "M22 12A10 10 0 1 1 12 2", key: "circle" }],
  ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8", key: "dollar" }],
  ["path", { d: "M12 18V6", key: "dollar-stroke" }],
  ["path", { d: "M16 2h6v6", key: "arrow-head" }],
  ["path", { d: "m22 2-3.5 3.5", key: "arrow" }],
]);

/**
 * The icon of an item on a disc, in the accent for good news: its kind's, the Connect one for a
 * payment made for a Stripe Connect account, or the reason of a churn.
 */
export function KindIcon({
  item,
  className,
}: {
  item: Pick<FeedItem, "kind" | "connect" | "churn">;
  className?: string;
}) {
  const { kind, connect, churn } = item;
  const Icon = connect
    ? CONNECT_PAYMENT_ICON
    : churn
      ? CHURN_ICONS[churn.reason]
      : KIND_ICONS[kind];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        isGoodNews(kind) ? "bg-(--glow-wash) text-(--glow-ink)" : "bg-(--fill) text-(--ink-2)",
        className,
      )}
    >
      <Icon aria-hidden className="size-[46%]" strokeWidth={2.2} />
    </span>
  );
}
