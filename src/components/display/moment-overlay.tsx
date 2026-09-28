import { CircleDollarSign, PartyPopper } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { itemContext, KIND_ICONS } from "@/components/display/feed-item";
import { MilestoneCelebration } from "@/components/display/milestone-celebration";
import { MomentCard, type MomentCardContent } from "@/components/display/moment-card";
import { formatAmount, formatPayment } from "@/lib/display/format";
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
  const mrr = (amount: number) => `${formatAmount(amount, currency, { signed: true })} MRR`;

  switch (moment.kind) {
    case "payment": {
      // A payment that started or upgraded a subscription is announced by what it started.
      const kind = moment.movement?.kind ?? "payment";
      return {
        icon: KIND_ICONS[kind],
        eyebrow: TITLES[kind],
        amount: formatPayment(moment.payment.amount, currency),
        details: itemContext(moment.payment, { showAccount }),
        footnote: moment.movement ? mrr(moment.movement.amount) : null,
        tone: "celebration",
      };
    }
    case "movement": {
      return {
        icon: KIND_ICONS[moment.movement.kind],
        eyebrow: TITLES[moment.movement.kind],
        amount: formatAmount(moment.movement.amount, currency, { signed: true }),
        recurring: true,
        details: itemContext(moment.movement, { showAccount }),
        tone: isMrrIncrease(moment.movement) ? "celebration" : "calm",
      };
    }
    case "summary": {
      const received = moment.revenue > 0;
      return {
        icon: CircleDollarSign,
        eyebrow: "Catching up",
        amount: received
          ? formatPayment(moment.revenue, currency)
          : formatAmount(moment.mrrChange, currency, { signed: true }),
        recurring: !received,
        details: [
          count(moment.payments, "new payment"),
          count(moment.changes, "subscription change"),
        ].filter((part): part is string => part !== null),
        footnote: received && moment.mrrChange !== 0 ? mrr(moment.mrrChange) : null,
        tone: received || moment.mrrChange >= 0 ? "celebration" : "calm",
      };
    }
    case "test": {
      // A typical payment of this business, rounded: it reads as a sample, not as real money.
      const { arpu } = state.metrics;
      const typical = arpu > 0 ? Math.max(1, Math.round(toMajorUnits(arpu, currency))) : 49;
      return {
        icon: PartyPopper,
        eyebrow: "Test celebration",
        amount: formatPayment(toMinorUnits(typical, currency), currency),
        details: ["This is how your next payment will look and sound"],
        tone: "celebration",
      };
    }
    case "milestone":
      // Without celebrations, a milestone is still worth a card.
      return {
        icon: PartyPopper,
        eyebrow: moment.isGoal ? "Goal reached" : "Milestone reached",
        amount: formatMoney(moment.amount, currency, { compact: true }),
        recurring: true,
        details: [],
        tone: "celebration",
      };
  }
}
