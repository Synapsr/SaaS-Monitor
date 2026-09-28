import {
  CircleDollarSign,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { countryFlag, countryName, formatAmount, formatPayment } from "@/lib/display/format";
import type { FeedItem, FeedItemKind } from "@/lib/display/types";
import { cn } from "@/lib/utils";

export const KIND_LABELS: Record<FeedItemKind, string> = {
  payment: "Payment",
  new: "New subscription",
  expansion: "Upgrade",
  reactivation: "Reactivation",
  contraction: "Downgrade",
  churn: "Cancellation",
};

/** One icon per kind of activity, in the feed and in the moments that announce it. */
export const KIND_ICONS: Record<FeedItemKind, LucideIcon> = {
  payment: CircleDollarSign,
  new: UserPlus,
  expansion: TrendingUp,
  reactivation: RotateCcw,
  contraction: TrendingDown,
  churn: UserMinus,
};

export function isGoodNews(kind: FeedItemKind): boolean {
  return kind !== "contraction" && kind !== "churn";
}

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

/** "$49" for a payment, "+$99" or "-$29" for a change of MRR. */
export function itemAmount(item: FeedItem, currency: string): string {
  return item.kind === "payment"
    ? formatPayment(item.amount, currency)
    : formatAmount(item.amount, currency, { signed: true });
}

/** What a screen may say about an item: customer (when shown), plan, country, account. */
export function itemContext(item: FeedItem, options: { showAccount: boolean }): string[] {
  const flag = countryFlag(item.country);
  return [
    item.customerName,
    item.planName,
    item.country ? [flag, countryName(item.country)].filter(Boolean).join(" ") : null,
    options.showAccount ? item.accountName : null,
  ].filter((part): part is string => Boolean(part));
}
