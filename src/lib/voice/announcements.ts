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
  "customer",
  "milestone",
] as const;

export type Announcement = (typeof ANNOUNCEMENTS)[number];

/**
 * The phrases of a voice: one per announcement, and a goal reached, which says more than a
 * milestone. Recorded clips and default phrases follow them.
 */
export type Phrase = Announcement | "goal";

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
  customer: ["name", "country", "product"],
  milestone: ["amount", "product"],
};
