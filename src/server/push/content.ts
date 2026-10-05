import "server-only";
import { createHash } from "node:crypto";
import { customerLabel } from "@/lib/display/customer";
import { churnDetails, itemContext, itemCountry } from "@/lib/display/feed";
import { formatAmount, formatPayment } from "@/lib/display/format";
import type { DisplayLocale } from "@/lib/display/i18n";
import { recurringMetric } from "@/lib/display/metric";
import { nextMilestone } from "@/lib/display/milestones";
import { momentAccount, type Moment } from "@/lib/display/moments";
import { formatMoney, toMajorUnits, toMinorUnits } from "@/lib/money";
import type { Metric } from "@/lib/screens/settings";

/*
 * What a notification says about a moment: what its card says on the screen, in the screen's
 * language, amounts and currency. Customers are named only on screens that show their names: the
 * items come from `toFeedItem`, which leaves them out otherwise.
 */

/** How a screen writes its notifications. */
export interface PushContext {
  locale: DisplayLocale;
  currency: string;
  metric: Metric;
  timeZone: string;
  /** The names of the screen's accounts when it shows several: each notification names its own. */
  accountNames: ReadonlyMap<string, string> | null;
}

export interface PushContent {
  title: string;
  body: string;
}

/** Details of a notification's body, one after the other. */
const SEPARATOR = " · ";

export function pushContent(moment: Moment, context: PushContext): PushContent {
  const { title, details } = describe(moment, context);
  const account = context.accountNames?.get(momentAccount(moment) ?? "");
  return {
    title: account ? `${account}${SEPARATOR}${title}` : title,
    body: details.filter((detail): detail is string => Boolean(detail)).join(SEPARATOR),
  };
}

function describe(
  moment: Moment,
  { locale: { language, locale, text }, currency, metric, timeZone }: PushContext,
): { title: string; details: (string | null)[] } {
  const recurring = recurringMetric(metric);
  // Changes of recurring revenue in the screen's metric: "+$149 MRR" is "+$1,788 ARR".
  const change = (mrr: number) =>
    `${formatAmount(recurring.fromMrr(mrr), currency, locale, { signed: true })} ${recurring.label}`;
  const payment = (amount: number) => formatPayment(amount, currency, locale);
  const context = { showAccount: false, language };

  switch (moment.kind) {
    case "payment": {
      const { connect } = moment.payment;
      return {
        title: connect ? text.moments.connectPayment : text.moments.titles.payment,
        details: [
          payment(moment.payment.amount),
          ...itemContext(moment.payment, context),
          connect?.applicationFee ? text.moments.connectFee(payment(connect.applicationFee)) : null,
        ],
      };
    }
    case "movement": {
      const { movement } = moment;
      const reason = movement.churn?.reason;
      return {
        title:
          reason && reason !== "canceled"
            ? text.moments.churnTitles[reason]
            : text.moments.titles[movement.kind],
        details: [
          change(movement.amount),
          ...itemContext(movement, context),
          churnDetails(movement, timeZone, { locale, text }),
        ],
      };
    }
    case "customer": {
      // Named when the screen shows names, else by where they come from.
      const name = customerLabel(moment.customer);
      const country = itemCountry(moment.customer, language);
      return {
        title: text.moments.titles.customer,
        details: name ? [name, country] : [country ?? text.moments.someoneNew],
      };
    }
    case "summary": {
      const received = moment.revenue > 0;
      return {
        title: text.moments.catchingUp,
        details: [
          received ? payment(moment.revenue) : change(moment.mrrChange),
          received && moment.mrrChange !== 0 ? change(moment.mrrChange) : null,
          moment.payments > 0 ? text.moments.payments(moment.payments) : null,
          moment.changes > 0 ? text.moments.changes(moment.changes) : null,
          moment.customers > 0 ? text.moments.customers(moment.customers) : null,
        ],
      };
    }
    case "milestone": {
      const compact = (amount: number) => formatMoney(amount, currency, { compact: true, locale });
      const next = toMinorUnits(nextMilestone(toMajorUnits(moment.amount, currency)), currency);
      return {
        title: `🎉 ${moment.isGoal ? text.moments.goalReached : text.moments.newMilestone}`,
        details: [
          `${compact(moment.amount)} ${recurringMetric(moment.metric).label}`,
          text.moments.nextStop(compact(next)),
        ],
      };
    }
    case "test":
      return { title: text.moments.test, details: [text.moments.testDetails] };
  }
}

/**
 * Names a screen in a notification's data without giving its token away: notifications go through
 * Expo, Apple and Google. The app knows which of its screens has this key.
 */
export function screenKey(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}
