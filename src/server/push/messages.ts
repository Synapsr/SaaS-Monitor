import "server-only";
import { momentEvents, type ScreenEvent } from "@/lib/display/events";
import type { MomentAudio } from "@/lib/display/moment-audio";
import type { Moment } from "@/lib/display/moments";
import { pushContent, type PushContent, type PushContext } from "./content";
import type { Device } from "./devices";

/*
 * Turns what each screen has to say into notifications for the phones following them, as each
 * phone chose: none when it turned the screen off, none of the events it muted. A phone may
 * follow several screens showing the same account: it hears of each thing once.
 */

/** From this many notifications at once, a phone gets a single one summing them up. */
export const MAX_PUSHES_PER_PHONE = 3;

/** A notification of a screen, before it is addressed to its phones. */
export interface Notice extends PushContent {
  /** The same for the same news on two screens, so that a phone following both hears it once. */
  key: string;
  /** `screenKey` of the screen it comes from. */
  screen: string;
  /** What it is about: one event, or those of the burst it sums up. */
  events: ScreenEvent[];
  /** A moment of the screen, or the test the founder sent from the dashboard. */
  type: PushData["type"];
  /** What the moment plays on the screen's displays; absent when it plays nothing. */
  audio?: MomentAudio;
}

/** What the app reads from a notification, to open the right screen and show the right icon. */
export interface PushData {
  type: "moment" | "test";
  screen: string;
  event: ScreenEvent;
  /**
   * The moment's sound and voice, for phones that play them as the notification's sound, like the
   * screen's displays (the app's notification service extension, on iOS).
   */
  audio?: MomentAudio;
}

export function pushData({ type, screen, events, audio }: Notice): PushData {
  return { type, screen, event: events[0], ...(audio && { audio }) };
}

/** What a screen tells its phones about what a sync just recorded. */
export interface ScreenNotices {
  devices: readonly Device[];
  /** One notice per moment, in the order things happened. */
  moments: Notice[];
  /** All of them at once, for a phone that would get too many; `null` when there is nothing. */
  summary: Notice | null;
  /** Milestones crossed: each worth a notification of its own, whatever else happened. */
  milestones: Notice[];
}

/** A notification for one phone. */
export interface Delivery {
  device: Device;
  notice: Notice;
}

/** The notice of a moment on a screen, and what the moment plays there. */
export function notice(
  moment: Moment,
  screen: string,
  context: PushContext,
  audio: MomentAudio | null,
): Notice {
  const content = pushContent(moment, context);
  return {
    ...content,
    // Moments of items are named after them, the same on every screen. Summaries and milestones
    // belong to their screen: two screens saying the same thing are said once.
    key:
      moment.kind === "summary" || moment.kind === "milestone"
        ? `${content.title}\n${content.body}`
        : moment.id,
    screen,
    events: momentEvents(moment),
    type: "moment",
    ...(audio && { audio }),
  };
}

/**
 * The phone a device is, whichever screen it follows: its native token, else its Expo token. A
 * reinstalled app keeps the phone's tokens.
 */
function phoneKey(device: Device): string | null {
  return device.deviceToken ?? device.pushToken;
}

/** Every phone's notifications. */
export function deliveries(screens: readonly ScreenNotices[]): Delivery[] {
  const phones = new Map<
    string,
    { device: Device; moments: Notice[]; summary: Notice | null; milestones: Notice[] }
  >();
  for (const screen of screens) {
    for (const device of screen.devices) {
      const key = phoneKey(device);
      if (!device.enabled || key === null) continue;
      // A notice reaches a phone that wants one of its events: a burst may be partly muted.
      const heard = ({ events }: Notice) =>
        events.some((event) => !device.mutedEvents.includes(event));
      const phone = phones.get(key) ?? { device, moments: [], summary: null, milestones: [] };
      phone.moments.push(...screen.moments.filter(heard));
      phone.milestones.push(...screen.milestones.filter(heard));
      if (!phone.summary && screen.summary && heard(screen.summary)) phone.summary = screen.summary;
      phones.set(key, phone);
    }
  }

  return [...phones.values()].flatMap(({ device, ...phone }) => {
    const moments = uniqueByKey(phone.moments);
    const said = moments.length > MAX_PUSHES_PER_PHONE && phone.summary ? [phone.summary] : moments;
    return uniqueByKey([...said, ...phone.milestones]).map((item) => ({ device, notice: item }));
  });
}

/** The first notice of each key. */
function uniqueByKey(notices: readonly Notice[]): Notice[] {
  const unique = new Map<string, Notice>();
  for (const item of notices) if (!unique.has(item.key)) unique.set(item.key, item);
  return [...unique.values()];
}
