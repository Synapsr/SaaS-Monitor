import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { LogoPulse } from "@/components/logo";
import type { RecurringMetric } from "@/lib/display/metric";
import { cn } from "@/lib/utils";

export interface MomentCardContent {
  icon: LucideIcon;
  eyebrow: string;
  /** An amount, or the name of a new customer. */
  headline: string;
  headlineKind?: "amount" | "name";
  /** For a change of recurring revenue rather than money received: "+$99 MRR", "+$1,188 ARR". */
  metric?: RecurringMetric["label"];
  /** The account it comes from, on a screen showing several. */
  account?: string | null;
  details: string[];
  footnote?: string | null;
  /** Losses are honest, never alarming: no glow, no color. */
  tone: "celebration" | "calm";
}

const SPRING = { type: "spring", duration: 0.7, bounce: 0.18 } as const;

/** A large card in the middle of the screen, readable from across the room. */
export function MomentCard({
  icon: Icon,
  eyebrow,
  headline,
  headlineKind = "amount",
  metric,
  account,
  details,
  footnote,
  tone,
}: MomentCardContent) {
  const celebration = tone === "celebration";
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, delay: 0.1 } }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--scrim),var(--scrim-edge))]" />
      <motion.article
        initial={{ opacity: 0, y: 48, scale: 0.94, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{
          opacity: 0,
          y: -20,
          scale: 0.98,
          filter: "blur(6px)",
          transition: { duration: 0.35 },
        }}
        transition={SPRING}
        className={cn(
          // Read from across the room: the card takes most of the screen's width.
          "relative flex w-[min(calc(var(--u)*112),92%)] flex-col items-center gap-5 overflow-hidden rounded-[calc(var(--rem)*3)] bg-(--card) px-20 pt-16 pb-16 text-center ring-1",
          celebration
            ? "shadow-(--moment-glow) ring-(--edge)"
            : "shadow-(--moment-shadow) ring-(--hairline)",
        )}
      >
        {celebration && (
          <div className="absolute inset-x-[15%] top-0 h-px bg-linear-to-r from-transparent via-(--glow) to-transparent" />
        )}
        {account && (
          <Reveal delay={0.04}>
            <AccountBadge name={account} />
          </Reveal>
        )}
        <Reveal delay={0.1}>
          <p
            className={cn(
              "flex items-center gap-3 text-3xl font-medium",
              celebration ? "text-(--glow-ink)" : "text-(--ink-2)",
            )}
          >
            <Icon aria-hidden className="size-[1.1em]" strokeWidth={2.2} />
            {eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          {headlineKind === "amount" ? (
            <p className="flex items-baseline gap-5 text-[length:calc(var(--rem)*10)] leading-none font-semibold tracking-[-0.04em] tabular-nums">
              <span className={celebration ? undefined : "text-(--ink-2)"}>{headline}</span>
              {metric && (
                <span className="text-5xl font-medium tracking-tight text-(--ink-3)">{metric}</span>
              )}
            </p>
          ) : (
            // Names run longer than amounts: smaller, and on two lines at most.
            <p className="line-clamp-2 text-8xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
              {headline}
            </p>
          )}
        </Reveal>
        {details.length > 0 && (
          <Reveal delay={0.26}>
            <p className="text-3xl text-balance text-(--ink-2)">{details.join(" · ")}</p>
          </Reveal>
        )}
        {footnote && (
          <Reveal delay={0.34}>
            <p
              className={cn(
                "mt-2 rounded-full px-8 py-3 text-3xl font-medium tabular-nums",
                // A loss is said plainly: no accent for when a subscription ends.
                celebration ? "bg-(--glow-wash) text-(--glow-ink)" : "bg-(--fill) text-(--ink-2)",
              )}
            >
              {footnote}
            </p>
          </Reveal>
        )}
      </motion.article>
    </motion.div>
  );
}

/**
 * Which account a moment comes from, when a screen shows several: the first thing read, so that
 * two moments of two accounts in a row are never mistaken for one another.
 */
export function AccountBadge({ name }: { name: string }) {
  return (
    <p className="flex max-w-full items-center gap-3 rounded-full bg-(--fill) py-2.5 pr-7 pl-5 text-3xl font-semibold text-(--ink) ring-1 ring-(--hairline)">
      <LogoPulse className="h-[0.8em] shrink-0 text-(--glow)" />
      <span className="truncate">{name}</span>
    </p>
  );
}

/** Staggered entrance of the parts of a moment: each settles a beat after the previous one. */
export function Reveal({ delay, children }: { delay: number; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}
