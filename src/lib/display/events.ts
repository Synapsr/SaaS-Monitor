import type { Moment } from "@/lib/display/moments";
import type { FeedItem } from "@/lib/display/types";
import type { ScreenSettings } from "@/lib/screens/settings";

/**
 * What can happen on a screen, each shown and heard as the screen's settings say. Payments made
 * for a Stripe Connect account are apart from the account's own: the money is not theirs.
 */
export const SCREEN_EVENTS = [
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

export type ScreenEvent = (typeof SCREEN_EVENTS)[number];

/** Events of the activity feed: a milestone is a moment, never an item of it. */
export type FeedEvent = Exclude<ScreenEvent, "milestone">;

export const FEED_EVENTS = SCREEN_EVENTS.filter(
  (event): event is FeedEvent => event !== "milestone",
);

/**
 * Where an event shows: in the activity `feed`, as a `moment` (a card, or the whole screen for a
 * milestone), with its `sound` and its `voice`. Each is switched on its own.
 */
export const CHANNELS = ["feed", "moment", "sound", "voice"] as const;

export type Channel = (typeof CHANNELS)[number];

type EventSettings = Pick<ScreenSettings, "events" | "sound" | "voice">;

/** The event of a feed item. */
export function itemEvent(item: Pick<FeedItem, "kind" | "connect" | "churn">): FeedEvent {
  switch (item.kind) {
    case "payment":
      return item.connect ? "connectPayment" : "payment";
    case "customer":
      return "customer";
    case "new":
      return "subscription";
    case "expansion":
      return "upgrade";
    case "reactivation":
      return "reactivation";
    case "contraction":
      return "downgrade";
    case "churn":
      // A failed payment is no customer leaving.
      return item.churn?.reason === "unpaid" ? "unpaid" : "cancellation";
  }
}

/**
 * The events a moment plays: one, or those of the items a burst sums up. A payment that started
 * or upgraded a subscription plays as what it started; a test celebration, as a payment.
 */
export function momentEvents(moment: Moment): ScreenEvent[] {
  switch (moment.kind) {
    case "payment":
      return [
        moment.movement && !moment.payment.connect
          ? itemEvent(moment.movement)
          : itemEvent(moment.payment),
      ];
    case "movement":
      return [itemEvent(moment.movement)];
    case "customer":
      return [itemEvent(moment.customer)];
    case "milestone":
      return ["milestone"];
    case "summary":
      return moment.events;
    case "test":
      return ["payment"];
  }
}

/**
 * Whether a moment shows or plays on `channel`: one of its events does, and the sound or the voice
 * is on. A test celebration was asked for: it plays everywhere its screen allows.
 */
export function momentPlays(moment: Moment, settings: EventSettings, channel: Channel): boolean {
  if (channel === "sound" && !settings.sound.enabled) return false;
  if (channel === "voice" && !settings.voice.enabled) return false;
  if (moment.kind === "test") return channel !== "feed";
  return momentEvents(moment).some((event) => settings.events[event][channel]);
}

/** Whether an event plays at all as a moment: shown, heard or said. */
export function eventPlays(event: ScreenEvent, settings: EventSettings): boolean {
  const channels = settings.events[event];
  return (
    channels.moment ||
    (channels.sound && settings.sound.enabled) ||
    (channels.voice && settings.voice.enabled)
  );
}
