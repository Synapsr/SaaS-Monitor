import {
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

/** The icon of a kind of activity on a disc, in the accent for good news. */
export function KindIcon({ kind, className }: { kind: FeedItemKind; className?: string }) {
  const Icon = KIND_ICONS[kind];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        isGoodNews(kind) ? "bg-(--glow-wash) text-(--glow-bright)" : "bg-white/6 text-(--ink-2)",
        className,
      )}
    >
      <Icon aria-hidden className="size-[46%]" strokeWidth={2.2} />
    </span>
  );
}
