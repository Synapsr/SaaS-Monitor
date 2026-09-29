import {
  CircleDollarSignIcon,
  createLucideIcon,
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
 * The icon of a kind of activity on a disc, in the accent for good news. A payment made for a
 * Stripe Connect account (`connect`) has its own icon.
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
        isGoodNews(kind) ? "bg-(--glow-wash) text-(--glow-ink)" : "bg-(--fill) text-(--ink-2)",
        className,
      )}
    >
      <Icon aria-hidden className="size-[46%]" strokeWidth={2.2} />
    </span>
  );
}
