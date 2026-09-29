import {
  CircleArrowOutUpRightIcon,
  CircleDollarSignIcon,
  RotateCcwIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserMinusIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import { isGoodNews } from "@/lib/display/feed";
import type { FeedItemKind } from "@/lib/display/types";
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

/** A payment made for one of the account's Stripe Connect accounts: money passing on. */
export const CONNECT_PAYMENT_ICON = CircleArrowOutUpRightIcon;

/**
 * The icon of a kind of activity on a disc, in the accent for good news. A payment made for a
 * Stripe Connect account (`connect`) has its own icon, on a quieter disc: the money isn't yours.
 */
export function KindIcon({
  kind,
  connect = false,
  className,
}: {
  kind: FeedItemKind;
  connect?: boolean;
  className?: string;
}) {
  const Icon = connect ? CONNECT_PAYMENT_ICON : KIND_ICONS[kind];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        !isGoodNews(kind)
          ? "bg-(--fill) text-(--ink-2)"
          : connect
            ? "bg-(--fill) text-(--glow-ink)"
            : "bg-(--glow-wash) text-(--glow-ink)",
        className,
      )}
    >
      <Icon aria-hidden className="size-[46%]" strokeWidth={2.2} />
    </span>
  );
}
