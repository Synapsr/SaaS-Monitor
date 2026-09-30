import type { ScreenEvent } from "@/lib/display/events";

/**
 * The phrases of a voice: one per screen event, and a few that say more about one. A goal is
 * more than a milestone; a subscription set not to renew, or paused, is a cancellation of its own
 * kind. Recorded clips and default phrases follow them.
 */
export type Phrase = ScreenEvent | "goal" | "cancellationScheduled" | "pause";

/** The event a phrase belongs to, whose own phrases it follows. */
export function phraseEvent(phrase: Phrase): ScreenEvent {
  switch (phrase) {
    case "goal":
      return "milestone";
    case "cancellationScheduled":
    case "pause":
      return "cancellation";
    default:
      return phrase;
  }
}

/** Details a phrase may say, written `{name}` in it. */
export const VARIABLES = ["name", "amount", "plan", "country", "product", "fee"] as const;

export type Variable = (typeof VARIABLES)[number];

/** The details each event knows, when Stripe has them. */
export const EVENT_VARIABLES: Record<ScreenEvent, readonly Variable[]> = {
  payment: ["name", "amount", "plan", "country", "product"],
  connectPayment: ["name", "amount", "fee", "country", "product"],
  subscription: ["name", "amount", "plan", "country", "product"],
  upgrade: ["name", "amount", "plan", "country", "product"],
  reactivation: ["name", "amount", "plan", "country", "product"],
  downgrade: ["name", "amount", "plan", "country", "product"],
  cancellation: ["name", "amount", "plan", "country", "product"],
  unpaid: ["name", "amount", "plan", "country", "product"],
  customer: ["name", "country", "product"],
  milestone: ["amount", "product"],
};
