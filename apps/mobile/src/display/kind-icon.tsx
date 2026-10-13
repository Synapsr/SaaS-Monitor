import { createElement } from "react";
import { View } from "react-native";
import { isGoodNews } from "@/contract/display/feed";
import type { ChurnReason, FeedItem, FeedItemKind } from "@/contract/display/types";
import { useDisplay } from "@/display/context";
import {
  CalendarXIcon,
  CircleDollarSignIcon,
  CirclePauseIcon,
  ConnectPaymentIcon,
  CreditCardXIcon,
  RotateCcwIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserMinusIcon,
  UserPlusIcon,
  type LucideProps,
} from "@/ui/icons";

type IconComponent = (props: Pick<LucideProps, "size" | "color" | "strokeWidth">) => React.ReactNode;

/** One icon per kind of activity, in the feed and in the moments that announce it. */
export const KIND_ICONS: Record<FeedItemKind, IconComponent> = {
  payment: CircleDollarSignIcon,
  customer: UserPlusIcon,
  new: SparklesIcon,
  expansion: TrendingUpIcon,
  reactivation: RotateCcwIcon,
  contraction: TrendingDownIcon,
  churn: UserMinusIcon,
};

/** Why a subscription stopped counting, in place of the icon of a churn. */
export const CHURN_ICONS: Record<ChurnReason, IconComponent> = {
  canceled: UserMinusIcon,
  scheduled: CalendarXIcon,
  unpaid: CreditCardXIcon,
  paused: CirclePauseIcon,
};

/** The icon of an item: its kind's, the Connect one, or the reason of a churn. */
export function itemIcon(item: Pick<FeedItem, "kind" | "connect" | "churn">): IconComponent {
  if (item.connect) return ConnectPaymentIcon;
  if (item.churn) return CHURN_ICONS[item.churn.reason];
  return KIND_ICONS[item.kind];
}

/** The icon of an item on a disc, in the accent for good news (the web's `KindIcon`). */
export function KindIcon({
  item,
  size,
}: {
  item: Pick<FeedItem, "kind" | "connect" | "churn">;
  /** Diameter of the disc, before the display's scale. */
  size: number;
}) {
  const { palette, scale } = useDisplay();
  const good = isGoodNews(item.kind);
  const diameter = size * scale;
  return (
    <View
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: good ? palette.glowWash : palette.fill,
      }}
    >
      {createElement(itemIcon(item), {
        size: diameter * 0.46,
        color: good ? palette.glowInk : palette.ink2,
        strokeWidth: 2.2,
      })}
    </View>
  );
}
