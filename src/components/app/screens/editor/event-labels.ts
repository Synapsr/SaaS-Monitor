import { PartyPopperIcon, type LucideIcon } from "lucide-react";
import { CHURN_ICONS, CONNECT_PAYMENT_ICON, KIND_ICONS } from "@/components/display/feed-kind-icon";
import type { ScreenEvent } from "@/lib/display/events";
import type { RecurringMetric } from "@/lib/display/metric";

/** How the screen settings name each event, with the icon screens show for it. */
export const EVENT_OPTIONS: Record<
  ScreenEvent,
  {
    /** Recurring revenue events are named after the screen's metric: "ARR milestone". */
    label: (metric: RecurringMetric["label"]) => string;
    description: string;
    icon: LucideIcon;
  }
> = {
  payment: {
    label: () => "Payment",
    description: "Every successful charge.",
    icon: KIND_ICONS.payment,
  },
  connectPayment: {
    label: () => "Connect payment",
    description: "Collected for a Stripe Connect account: the money is theirs.",
    icon: CONNECT_PAYMENT_ICON,
  },
  subscription: {
    label: () => "New subscriber",
    description: "A subscription starts paying.",
    icon: KIND_ICONS.new,
  },
  upgrade: {
    label: () => "Upgrade",
    description: "A subscription moves to a bigger plan.",
    icon: KIND_ICONS.expansion,
  },
  reactivation: {
    label: () => "Reactivation",
    description: "A former subscriber pays again.",
    icon: KIND_ICONS.reactivation,
  },
  downgrade: {
    label: () => "Downgrade",
    description: "A subscription moves to a smaller plan.",
    icon: KIND_ICONS.contraction,
  },
  cancellation: {
    label: () => "Cancellation",
    description: "A subscription stops, or is set not to renew.",
    icon: KIND_ICONS.churn,
  },
  unpaid: {
    label: () => "Payment failed",
    description: "Stripe’s retries of a subscription’s payment ran out.",
    icon: CHURN_ICONS.unpaid,
  },
  customer: {
    label: () => "New customer",
    description: "Created in Stripe, often at sign-up, before they pay.",
    icon: KIND_ICONS.customer,
  },
  milestone: {
    label: (metric) => `${metric} milestone`,
    description: "A milestone crossed, or the goal reached.",
    icon: PartyPopperIcon,
  },
};
