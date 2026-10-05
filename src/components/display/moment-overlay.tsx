import { CircleDollarSignIcon, PartyPopperIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { CHURN_ICONS, CONNECT_PAYMENT_ICON, KIND_ICONS } from "@/components/display/feed-kind-icon";
import { MilestoneCelebration } from "@/components/display/milestone-celebration";
import { MomentCard, type MomentCardContent } from "@/components/display/moment-card";
import { useDisplayLocale } from "@/hooks/use-display-locale";
import { customerLabel } from "@/lib/display/customer";
import { churnDetails, itemContext, itemCountry } from "@/lib/display/feed";
import { formatAmount, formatPayment } from "@/lib/display/format";
import type { DisplayLocale } from "@/lib/display/i18n";
import { recurringMetric } from "@/lib/display/metric";
import {
  isMrrIncrease,
  momentAccount,
  testPaymentAmount,
  type Moment,
} from "@/lib/display/moments";
import { screenView } from "@/lib/display/rotation";
import type { DisplayState } from "@/lib/display/types";
import { formatMoney } from "@/lib/money";

interface MomentOverlayProps {
  moment: Moment | null;
  state: DisplayState;
}

/** What is being celebrated right now: a card, or the whole screen for a milestone. */
export function MomentOverlay({ moment, state }: MomentOverlayProps) {
  const locale = useDisplayLocale();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute inset-0 z-30">
      <AnimatePresence>
        {moment?.kind === "milestone" && state.screen.settings.celebrations ? (
          <MilestoneCelebration
            key={moment.id}
            amount={moment.amount}
            metric={moment.metric}
            isGoal={moment.isGoal}
            currency={state.currency}
            account={accountName(moment, state)}
          />
        ) : (
          moment && <MomentCard key={moment.id} {...describe(moment, state, locale)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/** The account a moment comes from, named only when the screen shows several. */
function accountName(moment: Moment, state: DisplayState): string | null {
  if (state.accounts.length < 2) return null;
  const id = momentAccount(moment);
  return state.accounts.find((account) => account.id === id)?.name ?? null;
}

function describe(
  moment: Moment,
  state: DisplayState,
  { language, locale, text }: DisplayLocale,
): MomentCardContent {
  const { currency } = state;
  const recurring = recurringMetric(state.screen.settings.metric);
  const account = accountName(moment, state);
  // The badge names the account: details don't repeat it.
  const context = { showAccount: false, language };
  // Subscription changes in the screen's metric: "+$149" of MRR is "+$1,788" of ARR.
  const change = (mrr: number) =>
    formatAmount(recurring.fromMrr(mrr), currency, locale, { signed: true });
  const labeledChange = (mrr: number) => `${change(mrr)} ${recurring.label}`;

  switch (moment.kind) {
    case "payment": {
      const { connect } = moment.payment;
      if (connect) {
        // Money for a Stripe Connect account: the account's share is its fee.
        return {
          icon: CONNECT_PAYMENT_ICON,
          eyebrow: text.moments.connectPayment,
          headline: formatPayment(moment.payment.amount, currency, locale),
          account,
          details: itemContext(moment.payment, context),
          footnote: connect.applicationFee
            ? text.moments.connectFee(formatPayment(connect.applicationFee, currency, locale))
            : null,
          tone: "celebration",
        };
      }
      return {
        icon: KIND_ICONS.payment,
        eyebrow: text.moments.titles.payment,
        headline: formatPayment(moment.payment.amount, currency, locale),
        account,
        details: itemContext(moment.payment, context),
        tone: "celebration",
      };
    }
    case "movement": {
      const { movement } = moment;
      const reason = movement.churn?.reason;
      return {
        icon: movement.churn ? CHURN_ICONS[movement.churn.reason] : KIND_ICONS[movement.kind],
        eyebrow:
          reason && reason !== "canceled"
            ? text.moments.churnTitles[reason]
            : text.moments.titles[movement.kind],
        headline: change(movement.amount),
        metric: recurring.label,
        account,
        details: itemContext(movement, context),
        footnote: churnDetails(movement, state.screen.settings.timeZone, { locale, text }),
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
        icon: KIND_ICONS.customer,
        eyebrow: text.moments.titles.customer,
        headline: name ?? country ?? text.moments.someoneNew,
        headlineKind: "name",
        account,
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
        icon: CircleDollarSignIcon,
        eyebrow: text.moments.catchingUp,
        headline: received
          ? formatPayment(moment.revenue, currency, locale)
          : change(moment.mrrChange),
        metric: received ? undefined : recurring.label,
        account,
        details: counts.filter((part): part is string => Boolean(part)),
        footnote: received && moment.mrrChange !== 0 ? labeledChange(moment.mrrChange) : null,
        tone: received || moment.mrrChange >= 0 ? "celebration" : "calm",
      };
    }
    case "test":
      return {
        icon: PartyPopperIcon,
        eyebrow: text.moments.test,
        headline: formatPayment(testPaymentAmount(state), currency, locale),
        details: [text.moments.testDetails],
        tone: "celebration",
      };
    case "milestone":
      // Without celebrations, a milestone is still worth a card.
      return {
        icon: PartyPopperIcon,
        eyebrow: moment.isGoal ? text.moments.goalReached : text.moments.milestoneReached,
        headline: formatMoney(moment.amount, currency, { compact: true, locale }),
        metric: recurringMetric(moment.metric).label,
        account,
        details: [],
        tone: "celebration",
      };
  }
}
