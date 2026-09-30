/**
 * What a voice can announce, each switched on or off in a screen's settings. Payments made for a
 * Stripe Connect account are apart from the account's own: the money is not theirs.
 */
export const ANNOUNCEMENTS = [
  "payment",
  "connectPayment",
  "subscription",
  "upgrade",
  "reactivation",
  "downgrade",
  "cancellation",
  "unpaid",
  "customer",
  "milestone",
] as const;

export type Announcement = (typeof ANNOUNCEMENTS)[number];

/**
 * The phrases of a voice: one per announcement, and a few that say more about one. A goal is more
 * than a milestone; a subscription set not to renew, or paused, is a cancellation of its own
 * kind. Recorded clips and default phrases follow them.
 */
export type Phrase = Announcement | "goal" | "cancellationScheduled" | "pause";

/** The announcement a phrase belongs to, whose switch and own phrases it follows. */
export function phraseAnnouncement(phrase: Phrase): Announcement {
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

/** The details each announcement knows, when Stripe has them. */
export const ANNOUNCEMENT_VARIABLES: Record<Announcement, readonly Variable[]> = {
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
