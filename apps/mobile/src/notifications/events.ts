import type { ScreenEvent } from "@/contract/display/events";
import type { RecurringMetric } from "@/contract/display/metric";
import type { DisplayState } from "@/contract/display/types";

/** How the app names each event, as the screen settings of the web do. */
export const EVENT_LABELS: Record<ScreenEvent, { label: (metric: RecurringMetric["label"]) => string; description: string }> = {
  payment: { label: () => "Payment", description: "Every successful charge." },
  connectPayment: {
    label: () => "Connect payment",
    description: "Collected for a Stripe Connect account: the money is theirs.",
  },
  subscription: { label: () => "New subscriber", description: "A subscription starts paying." },
  upgrade: { label: () => "Upgrade", description: "A subscription moves to a bigger plan." },
  reactivation: { label: () => "Reactivation", description: "A former subscriber pays again." },
  downgrade: { label: () => "Downgrade", description: "A subscription moves to a smaller plan." },
  cancellation: {
    label: () => "Cancellation",
    description: "A subscription stops, or is set not to renew.",
  },
  unpaid: { label: () => "Payment failed", description: "Stripe’s retries of a subscription’s payment ran out." },
  customer: { label: () => "New customer", description: "Created in Stripe, often at sign-up, before they pay." },
  milestone: { label: (metric) => `${metric} milestone`, description: "A milestone crossed, or the goal reached." },
};

/**
 * Whether the screen sends an event to phones at all (its Events settings, column "Phone");
 * `null` before its state is known.
 */
export function screenSendsEvent(state: DisplayState | undefined, event: ScreenEvent): boolean | null {
  if (!state) return null;
  return state.screen.settings.events[event].push;
}
