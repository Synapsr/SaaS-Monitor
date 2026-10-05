import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { screenAccounts, screens } from "@/db/schema";
import { itemEvent } from "@/lib/display/events";
import { displayLocale } from "@/lib/display/i18n";
import {
  crossedMilestones,
  planMoments,
  summaryMoment,
  type Moment,
  type MrrSpan,
} from "@/lib/display/moments";
import type { FeedItem } from "@/lib/display/types";
import { parseScreenSettings, type ScreenSettings } from "@/lib/screens/settings";
import {
  activityByIds,
  linkedAccounts,
  subscriptionTotals,
  type ActivityRow,
} from "@/server/display/queries";
import { toFeedItem } from "@/server/display/state";
import { createCurrencyConverter, type CurrencyConverter, type RateSource } from "@/server/fx";
import { claimLiveActivity, claimMilestones } from "./claims";
import { screenKey, type PushContext } from "./content";
import { forgetPushTokens, screenDevices } from "./devices";
import {
  EXPO_BATCH_SIZE,
  expoPushSender,
  isUnregistered,
  type PushMessage,
  type PushSender,
  type PushTicket,
} from "./expo";
import { notice, pushMessages, type ScreenNotices } from "./messages";

/*
 * Phones following a screen hear of what its accounts' syncs record, like the screen's displays
 * see it: the moments of `planMoments`, in the screen's language, for the events it sends to
 * phones (`settings.events`, channel `push`). There is no worker: syncs run when a display polls,
 * the dashboard is open, or a Stripe webhook arrives. Only webhooks make notifications instant.
 */

export interface PushOptions {
  /** Sends a batch of messages: Expo's push API, or a fake in tests. */
  send?: PushSender;
  /** Current time, for tests. */
  now?: Date;
  /** Exchange rates source, for tests. */
  rateSource?: RateSource;
}

/**
 * Notifies the phones following the account's screens of what the sync just recorded, once its
 * transaction is committed. Best effort: failures are logged, never thrown, and a slow Expo
 * answer is given up on (`expoPushSender`).
 */
export async function notifyPhones(accountId: string, options: PushOptions = {}): Promise<void> {
  try {
    const sent = await notify(accountId, options);
    if (sent) console.info(`[push] account=${accountId} notifications=${sent}`);
  } catch (error) {
    console.warn(
      `[push] account=${accountId} could not notify phones:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/** Sends the notifications of what the account recorded, and returns how many were sent. */
async function notify(
  accountId: string,
  { send = expoPushSender, now = new Date(), rateSource }: PushOptions,
): Promise<number> {
  // Claimed whether phones follow the account or not: what happened before a phone follows a
  // screen is no news to it.
  const ids = await claimLiveActivity(accountId, now);
  if (!ids.movements.length && !ids.payments.length && !ids.customers.length) return 0;
  const followed = await followedScreens(accountId);
  if (!followed.length) return 0;

  // Moments are planned in the order things happened.
  const rows = (await activityByIds(accountId, ids)).reverse();
  const notices = await Promise.all(
    followed.map((screen) => screenNotices(screen, rows, accountId, { now, rateSource })),
  );
  const messages = pushMessages(notices);
  const tickets = await sendInBatches(messages, send);
  await forgetPushTokens(
    tickets.filter(({ ticket }) => isUnregistered(ticket)).map(({ message }) => message.to),
  );
  return tickets.filter(({ ticket }) => ticket.status === "ok").length;
}

interface FollowedScreen {
  id: string;
  token: string;
  settings: ScreenSettings;
  pushTokens: string[];
}

/** The screens showing the account that phones follow. */
async function followedScreens(accountId: string): Promise<FollowedScreen[]> {
  const rows = await db()
    .select({ id: screens.id, token: screens.publicToken, settings: screens.settings })
    .from(screenAccounts)
    .innerJoin(screens, eq(screens.id, screenAccounts.screenId))
    .where(eq(screenAccounts.accountId, accountId));
  const devices = await screenDevices(rows.map((row) => row.id));
  return rows.flatMap((row) => {
    const pushTokens = devices.get(row.id);
    if (!pushTokens) return [];
    return [{ ...row, settings: parseScreenSettings(row.settings), pushTokens }];
  });
}

/** What a screen tells its phones about the account's new rows (oldest first). */
async function screenNotices(
  screen: FollowedScreen,
  rows: readonly ActivityRow[],
  accountId: string,
  { now, rateSource }: { now: Date; rateSource?: RateSource },
): Promise<ScreenNotices> {
  const { settings } = screen;
  const { currency } = settings;
  const accounts = await linkedAccounts(screen.id);
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
  const notifiesMilestones = settings.events.milestone.push;
  const totals = notifiesMilestones
    ? await subscriptionTotals(accounts.map((account) => account.id))
    : [];
  const converter = await createCurrencyConverter(
    currency,
    [...rows, ...totals].flatMap((row) => row.currency ?? []),
    { now, source: rateSource },
  );

  // As the screen shows them: in its currency, customers named only if it shows names.
  const items = rows.flatMap((row) => {
    const item = toFeedItem(row, converter, settings, accountNames.get(row.accountId) ?? "");
    return item ? [item] : [];
  });
  const pushed = items.filter((item) => settings.events[itemEvent(item)].push);

  const key = screenKey(screen.token);
  const context: PushContext = {
    locale: displayLocale(settings.language),
    currency,
    metric: settings.metric,
    timeZone: settings.timeZone,
    // Like the screen's moments, notifications name their account when it shows several.
    accountNames: accounts.length > 1 ? accountNames : null,
  };
  const toNotice = (moment: Moment) => notice(moment, key, context);

  let milestones: Moment[] = [];
  if (notifiesMilestones) {
    const spans = mrrSpans({ items, totals, converter, accounts, accountId, settings });
    const crossed = crossedMilestones(spans, settings, currency);
    const claimed = await claimMilestones(
      screen.id,
      crossed.map((moment) => moment.id),
    );
    milestones = crossed.filter((moment) => claimed.has(moment.id));
  }

  return {
    pushTokens: screen.pushTokens,
    moments: planMoments(pushed).map(toNotice),
    summary: pushed.length ? toNotice(summaryMoment(pushed)) : null,
    milestones: milestones.map(toNotice),
  };
}

/**
 * How the screen's MRR moved with the account's new movements: what it is now, less what they
 * changed. Only the account that synced moved; each account counts on its own on a screen
 * showing them one at a time, like on its displays.
 */
function mrrSpans({
  items,
  totals,
  converter,
  accounts,
  accountId,
  settings,
}: {
  items: readonly FeedItem[];
  totals: readonly { accountId: string; currency: string; mrr: number }[];
  converter: CurrencyConverter;
  accounts: readonly { id: string; status: string }[];
  accountId: string;
  settings: ScreenSettings;
}): { total: MrrSpan; views: (MrrSpan & { accountId: string })[] } {
  const mrr = new Map<string, number>();
  for (const row of totals) {
    const amount = converter.convert(row.mrr, row.currency) ?? 0;
    mrr.set(row.accountId, (mrr.get(row.accountId) ?? 0) + amount);
  }
  const change = items
    .filter((item) => item.kind !== "payment" && item.kind !== "customer")
    .reduce((sum, item) => sum + item.amount, 0);
  const span = (after: number, moved: boolean): MrrSpan => ({
    before: moved ? after - change : after,
    after,
  });

  const total = [...mrr.values()].reduce((sum, amount) => sum + amount, 0);
  // Displays show each account on its own once it is imported, on screens of several.
  const views =
    settings.rotation.enabled && accounts.length > 1
      ? accounts
          .filter((account) => account.status === "ready")
          .map((account) => ({
            accountId: account.id,
            ...span(mrr.get(account.id) ?? 0, account.id === accountId),
          }))
      : [];
  return { total: span(total, true), views };
}

/**
 * Sends the messages by batches, each on its own: a batch Expo refuses does not keep the others
 * from going. Returns the tickets of the batches sent, with their message.
 */
async function sendInBatches(
  messages: readonly PushMessage[],
  send: PushSender,
): Promise<{ message: PushMessage; ticket: PushTicket }[]> {
  const tickets: { message: PushMessage; ticket: PushTicket }[] = [];
  for (let start = 0; start < messages.length; start += EXPO_BATCH_SIZE) {
    const batch = messages.slice(start, start + EXPO_BATCH_SIZE);
    try {
      const answers = await send(batch);
      tickets.push(...batch.map((message, index) => ({ message, ticket: answers[index] })));
    } catch (error) {
      console.warn(
        `[push] ${batch.length} notifications could not be sent:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  return tickets;
}
