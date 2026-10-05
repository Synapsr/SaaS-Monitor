import "server-only";
import { momentEvents, type ScreenEvent } from "@/lib/display/events";
import type { Moment } from "@/lib/display/moments";
import { pushContent, type PushContent, type PushContext } from "./content";
import type { PushMessage } from "./expo";

/*
 * Turns what each screen has to say into messages for the phones following them. A phone may
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
  event: ScreenEvent;
}

/** What a screen tells its phones about what a sync just recorded. */
export interface ScreenNotices {
  pushTokens: readonly string[];
  /** One notice per moment, in the order things happened. */
  moments: Notice[];
  /** All of them at once, for a phone that would get too many; `null` when there is nothing. */
  summary: Notice | null;
  /** Milestones crossed: each worth a notification of its own, whatever else happened. */
  milestones: Notice[];
}

/** The notice of a moment on a screen. */
export function notice(moment: Moment, screen: string, context: PushContext): Notice {
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
    event: momentEvents(moment)[0],
  };
}

/** Every phone's notifications, as Expo push messages. */
export function pushMessages(screens: readonly ScreenNotices[]): PushMessage[] {
  const phones = new Map<string, { moments: Notice[]; summary: Notice | null; others: Notice[] }>();
  for (const screen of screens) {
    for (const pushToken of screen.pushTokens) {
      const phone = phones.get(pushToken) ?? { moments: [], summary: screen.summary, others: [] };
      phone.moments.push(...screen.moments);
      phone.others.push(...screen.milestones);
      phone.summary ??= screen.summary;
      phones.set(pushToken, phone);
    }
  }

  return [...phones].flatMap(([pushToken, phone]) => {
    const moments = uniqueByKey(phone.moments);
    const said = moments.length > MAX_PUSHES_PER_PHONE && phone.summary ? [phone.summary] : moments;
    return uniqueByKey([...said, ...phone.others]).map((item) => message(pushToken, item));
  });
}

/** The first notice of each key. */
function uniqueByKey(notices: readonly Notice[]): Notice[] {
  const unique = new Map<string, Notice>();
  for (const item of notices) if (!unique.has(item.key)) unique.set(item.key, item);
  return [...unique.values()];
}

function message(to: string, { title, body, screen, event }: Notice): PushMessage {
  return {
    to,
    title,
    body,
    data: { type: "moment", screen, event },
    sound: "default",
    priority: "high",
    channelId: "moments",
    interruptionLevel: "time-sensitive",
  };
}
