import { CircleDollarSignIcon, PartyPopperIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { KIND_ICONS } from "@/components/display/feed-kind-icon";
import { MilestoneCelebration } from "@/components/display/milestone-celebration";
import { MomentCard, type MomentCardContent } from "@/components/display/moment-card";
import { itemContext } from "@/lib/display/feed";
import { formatAmount, formatPayment } from "@/lib/display/format";
import { recurringMetric } from "@/lib/display/metric";
import { isMrrIncrease, type Moment } from "@/lib/display/moments";
import type { DisplayState, FeedItemKind } from "@/lib/display/types";
import { formatMoney, toMajorUnits, toMinorUnits } from "@/lib/money";

interface MomentOverlayProps {
  moment: Moment | null;
  state: DisplayState;
}

/** What is being celebrated right now: a card, or the whole screen for a milestone. */
export function MomentOverlay({ moment, state }: MomentOverlayProps) {
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
          />
        ) : (
          moment && <MomentCard key={moment.id} {...describe(moment, state)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/** How each kind of activity is announced. */
const TITLES: Record<FeedItemKind, string> = {
  payment: "Payment received",
  new: "New customer",
  expansion: "Upgrade",
  reactivation: "Welcome back",
  contraction: "Downgrade",
  churn: "Subscription canceled",
};

/** "1 new payment", "3 new payments", or nothing for none. */
function count(value: number, noun: string): string | null {
  if (value === 0) return null;
  return `${value} ${noun}${value > 1 ? "s" : ""}`;
}

function describe(moment: Moment, state: DisplayState): MomentCardContent {
  const { currency } = state;
  const showAccount = state.accounts.length > 1;
  const recurring = recurringMetric(state.screen.settings.metric);
  // Subscription changes in the screen's metric: "+$149" of MRR is "+$1,788" of ARR.
  const change = (mrr: number) => formatAmount(recurring.fromMrr(mrr), currency, { signed: true });
  const labeledChange = (mrr: number) => `${change(mrr)} ${recurring.label}`;

  switch (moment.kind) {
    case "payment": {
      // A payment that started or upgraded a subscription is announced by what it started.
      const kind = moment.movement?.kind ?? "payment";
      return {
        icon: KIND_ICONS[kind],
        eyebrow: TITLES[kind],
        amount: formatPayment(moment.payment.amount, currency),
        details: itemContext(moment.payment, { showAccount }),
        footnote: moment.movement ? labeledChange(moment.movement.amount) : null,
        tone: "celebration",
      };
    }
    case "movement": {
      return {
        icon: KIND_ICONS[moment.movement.kind],
        eyebrow: TITLES[moment.movement.kind],
        amount: change(moment.movement.amount),
        metric: recurring.label,
        details: itemContext(moment.movement, { showAccount }),
        tone: isMrrIncrease(moment.movement) ? "celebration" : "calm",
      };
    }
    case "summary": {
      const received = moment.revenue > 0;
      return {
        icon: CircleDollarSignIcon,
        eyebrow: "Catching up",
        amount: received ? formatPayment(moment.revenue, currency) : change(moment.mrrChange),
        metric: received ? undefined : recurring.label,
        details: [
          count(moment.payments, "new payment"),
          count(moment.changes, "subscription change"),
        ].filter((part): part is string => part !== null),
        footnote: received && moment.mrrChange !== 0 ? labeledChange(moment.mrrChange) : null,
        tone: received || moment.mrrChange >= 0 ? "celebration" : "calm",
      };
    }
    case "test": {
      // A typical payment of this business, rounded: it reads as a sample, not as real money.
      const { arpu } = state.metrics;
      const typical = arpu > 0 ? Math.max(1, Math.round(toMajorUnits(arpu, currency))) : 49;
      return {
        icon: PartyPopperIcon,
        eyebrow: "Test celebration",
        amount: formatPayment(toMinorUnits(typical, currency), currency),
        details: ["This is how your next payment will look and sound"],
        tone: "celebration",
      };
    }
    case "milestone":
      // Without celebrations, a milestone is still worth a card.
      return {
        icon: PartyPopperIcon,
        eyebrow: moment.isGoal ? "Goal reached" : "Milestone reached",
        amount: formatMoney(moment.amount, currency, { compact: true }),
        metric: recurringMetric(moment.metric).label,
        details: [],
        tone: "celebration",
      };
  }
}
