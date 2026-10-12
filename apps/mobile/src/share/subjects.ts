import { calendarDay } from "@/contract/display/calendar";
import { customerLabel } from "@/contract/display/customer";
import { itemKindLabel } from "@/contract/display/feed";
import { displayLocale } from "@/contract/display/i18n";
import type { RecurringMetric } from "@/contract/display/metric";
import type { Moment } from "@/contract/display/moments";
import type { DisplayState, FeedItem } from "@/contract/display/types";
import type { Metric } from "@/contract/screens/settings";

/** The four numbers under the chart. */
export type TileKey = "today" | "month" | "customers" | "net";

/** What an image shows: the whole screen, one of its parts, or one of its moments. */
export type ShareSubject =
  | { kind: "screen" }
  | { kind: "hero" }
  | { kind: "goal" }
  | { kind: "chart" }
  | { kind: "tiles" }
  | { kind: "tile"; tile: TileKey }
  | { kind: "feed" }
  /** An event of the feed, as the card the wall shows when it happens. */
  | { kind: "item"; item: FeedItem }
  | { kind: "milestone"; amount: number; metric: Metric; isGoal: boolean; accountId: string | null };

/** The parts a screen can always be shared as, in the order of the screen. */
const PARTS: readonly ShareSubject[] = [
  { kind: "screen" },
  { kind: "hero" },
  { kind: "goal" },
  { kind: "chart" },
  { kind: "tiles" },
  { kind: "feed" },
];

/** Events of the feed an image lists: a few, the latest, so that the image stays readable. */
const FEED_ITEMS = { screen: 4, feed: 6 } as const;

/** Tells subjects apart: two items are the same subject when they are the same event. */
export function subjectKey(subject: ShareSubject): string {
  switch (subject.kind) {
    case "tile":
      return `tile:${subject.tile}`;
    case "item":
      return `item:${subject.item.id}`;
    case "milestone":
      return `milestone:${subject.accountId ?? "total"}:${subject.metric}:${subject.amount}`;
    default:
      return subject.kind;
  }
}

/** What the share sheet offers: what was pressed first, when it isn't one of the parts. */
export function shareChoices(pressed: ShareSubject): ShareSubject[] {
  const key = subjectKey(pressed);
  return PARTS.some((part) => subjectKey(part) === key) ? [...PARTS] : [pressed, ...PARTS];
}

const english = displayLocale("en").text;

/** The name of a subject in the app, which speaks English: "MRR", "Revenue today", "Payment". */
export function subjectLabel(subject: ShareSubject, metric: RecurringMetric["label"]): string {
  switch (subject.kind) {
    case "screen":
      return "Whole screen";
    case "hero":
      return metric;
    case "goal":
      return "Goal";
    case "chart":
      return `${metric} chart`;
    case "tiles":
      return "Key numbers";
    case "tile":
      return {
        today: english.tiles.revenueToday,
        month: english.tiles.thisMonth,
        customers: english.tiles.customers,
        net: english.tiles.netNew(metric),
      }[subject.tile];
    case "feed":
      return "Activity";
    case "item":
      return itemKindLabel(subject.item, english);
    case "milestone":
      return subject.isGoal ? "Goal reached" : "Milestone";
  }
}

/**
 * Where the image lands (a chat, Photos, Files) names it: "Office – MRR – 2026-10-12.png". The
 * whole screen goes without a part's name.
 */
export function shareFileName(screenName: string, subject: ShareSubject, metric: RecurringMetric["label"], day: string): string {
  // Characters file systems refuse, and control characters.
  const clean = (part: string) => part.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim();
  const parts = [clean(screenName) || "SaaS Monitor", subject.kind === "screen" ? null : clean(subjectLabel(subject, metric)), day];
  return `${parts.filter(Boolean).join(" – ")}.png`;
}

/** The day of an image, in the screen's time zone: `YYYY-MM-DD`. */
export function shareDay(at: number, timeZone: string): string {
  return calendarDay(new Date(at), timeZone);
}

/** The events of the feed an image of this subject lists, the latest first. */
export function sharedFeed(subject: ShareSubject, feed: FeedItem[]): FeedItem[] {
  if (subject.kind === "screen" || subject.kind === "feed") return feed.slice(0, FEED_ITEMS[subject.kind]);
  if (subject.kind === "item") return [subject.item];
  return [];
}

/** Whether an image of this subject would name customers: worth asking before it does. */
export function namesCustomers(subject: ShareSubject, feed: FeedItem[]): boolean {
  return sharedFeed(subject, feed).some((item) => customerLabel(item) !== null);
}

function anonymous(item: FeedItem): FeedItem {
  return item.customerName === null && item.customerEmail === null
    ? item
    : { ...item, customerName: null, customerEmail: null };
}

/**
 * The screen and the subject an image is drawn from: without customer names unless asked for
 * (images travel further than screens), and without warnings, which are for the team.
 */
export function shareSource(
  state: DisplayState,
  subject: ShareSubject,
  { customerNames }: { customerNames: boolean },
): { state: DisplayState; subject: ShareSubject } {
  const shown = { ...state, warnings: [] };
  if (customerNames) return { state: shown, subject };
  return {
    state: { ...shown, feed: state.feed.map(anonymous) },
    subject: subject.kind === "item" ? { ...subject, item: anonymous(subject.item) } : subject,
  };
}

/** What a moment on screen is shared as: its event, or its milestone. Summaries and tests are not. */
export function momentSubject(moment: Moment): ShareSubject | null {
  switch (moment.kind) {
    case "payment":
      return { kind: "item", item: moment.payment };
    case "movement":
      return { kind: "item", item: moment.movement };
    case "customer":
      return { kind: "item", item: moment.customer };
    case "milestone":
      return { kind: "milestone", amount: moment.amount, metric: moment.metric, isGoal: moment.isGoal, accountId: moment.accountId };
    default:
      return null;
  }
}

/** The moment of an event of the feed, to draw it as the wall's card. */
export function itemMoment(item: FeedItem): Moment {
  if (item.kind === "payment") return { id: item.id, kind: "payment", payment: item };
  if (item.kind === "customer") return { id: item.id, kind: "customer", customer: item };
  return { id: item.id, kind: "movement", movement: item };
}
