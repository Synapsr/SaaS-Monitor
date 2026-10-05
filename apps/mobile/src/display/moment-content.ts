import { customerLabel } from "@/contract/display/customer";
import { churnDetails, itemContext, itemCountry } from "@/contract/display/feed";
import { formatAmount, formatPayment } from "@/contract/display/format";
import type { DisplayLocale } from "@/contract/display/i18n";
import { recurringMetric, type RecurringMetric } from "@/contract/display/metric";
import { isMrrIncrease, momentAccount, testPaymentAmount, type Moment } from "@/contract/display/moments";
import { screenView } from "@/contract/display/rotation";
import type { DisplayState, FeedItem } from "@/contract/display/types";
import { formatMoney } from "@/contract/money";

/**
 * What a moment's card says, as the web's moment overlay writes it (`describe` in
 * `moment-overlay.tsx`): the same words, in the screen's language.
 */
export interface MomentCardContent {
  /** The icon of an item, or the dollar of a summary, or the party popper. */
  icon: { item: Pick<FeedItem, "kind" | "connect" | "churn"> } | "dollar" | "party";
  eyebrow: string;
  /** An amount, or the name of a new customer. */
  headline: string;
  headlineKind: "amount" | "name";
  /** For a change of recurring revenue rather than money received: "+$99 MRR". */
  metric: RecurringMetric["label"] | null;
  /** The account it comes from, on a screen showing several. */
  account: string | null;
  details: string[];
  footnote: string | null;
  /** Losses are honest, never alarming: no glow, no color. */
  tone: "celebration" | "calm";
}

/** The account a moment comes from, named only when the screen shows several. */
export function momentAccountName(moment: Moment, state: DisplayState): string | null {
  if (state.accounts.length < 2) return null;
  const id = momentAccount(moment);
  return state.accounts.find((account) => account.id === id)?.name ?? null;
}

export function describeMoment(
  moment: Moment,
  state: DisplayState,
  displayLocale: DisplayLocale,
): MomentCardContent {
  const { language, locale, text } = displayLocale;
  const { currency } = state;
  const recurring = recurringMetric(state.screen.settings.metric);
  const account = momentAccountName(moment, state);
  // The badge names the account: details don't repeat it.
  const context = { showAccount: false, language };
  const change = (mrr: number) =>
    formatAmount(recurring.fromMrr(mrr), currency, locale, { signed: true });
  const base = { headlineKind: "amount", metric: null, account, footnote: null } as const;

  switch (moment.kind) {
    case "payment": {
      const { payment } = moment;
      if (payment.connect) {
        // Money for a Stripe Connect account: the account's share is its fee.
        return {
          ...base,
          icon: { item: payment },
          eyebrow: text.moments.connectPayment,
          headline: formatPayment(payment.amount, currency, locale),
          details: itemContext(payment, context),
          footnote: payment.connect.applicationFee
            ? text.moments.connectFee(formatPayment(payment.connect.applicationFee, currency, locale))
            : null,
          tone: "celebration",
        };
      }
      return {
        ...base,
        icon: { item: payment },
        eyebrow: text.moments.titles.payment,
        headline: formatPayment(payment.amount, currency, locale),
        details: itemContext(payment, context),
        tone: "celebration",
      };
    }
    case "movement": {
      const { movement } = moment;
      const reason = movement.churn?.reason;
      return {
        ...base,
        icon: { item: movement },
        eyebrow:
          reason && reason !== "canceled"
            ? text.moments.churnTitles[reason]
            : text.moments.titles[movement.kind],
        headline: change(movement.amount),
        metric: recurring.label,
        details: itemContext(movement, context),
        footnote: churnDetails(movement, state.screen.settings.timeZone, displayLocale),
        tone: isMrrIncrease(movement) ? "celebration" : "calm",
      };
    }
    case "customer": {
      // Named when the screen shows names, else by where they come from.
      const { customer } = moment;
      const name = customerLabel(customer);
      const country = itemCountry(customer, language);
      const today = screenView(state, customer.accountId).metrics.customersCreatedToday;
      return {
        ...base,
        icon: { item: customer },
        eyebrow: text.moments.titles.customer,
        headline: name ?? country ?? text.moments.someoneNew,
        headlineKind: "name",
        details: name && country ? [country] : [],
        footnote: today > 0 ? text.moments.customersToday(today) : null,
        tone: "celebration",
      };
    }
    case "summary": {
      const received = moment.revenue > 0;
      const counts = [
        moment.payments > 0 && text.moments.payments(moment.payments),
        moment.changes > 0 && text.moments.changes(moment.changes),
        moment.customers > 0 && text.moments.customers(moment.customers),
      ];
      return {
        ...base,
        icon: "dollar",
        eyebrow: text.moments.catchingUp,
        headline: received
          ? formatPayment(moment.revenue, currency, locale)
          : change(moment.mrrChange),
        metric: received ? null : recurring.label,
        details: counts.filter((part): part is string => Boolean(part)),
        footnote:
          received && moment.mrrChange !== 0
            ? `${change(moment.mrrChange)} ${recurring.label}`
            : null,
        tone: received || moment.mrrChange >= 0 ? "celebration" : "calm",
      };
    }
    case "test":
      return {
        ...base,
        icon: "party",
        eyebrow: text.moments.test,
        headline: formatPayment(testPaymentAmount(state), currency, locale),
        account: null,
        details: [text.moments.testDetails],
        tone: "celebration",
      };
    case "milestone":
      // Without celebrations, a milestone is still worth a card.
      return {
        ...base,
        icon: "party",
        eyebrow: moment.isGoal ? text.moments.goalReached : text.moments.milestoneReached,
        headline: formatMoney(moment.amount, currency, { compact: true, locale }),
        metric: recurringMetric(moment.metric).label,
        details: [],
        tone: "celebration",
      };
  }
}
