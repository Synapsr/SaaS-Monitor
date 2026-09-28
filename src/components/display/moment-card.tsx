import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MomentCardContent {
  icon: LucideIcon;
  eyebrow: string;
  amount: string;
  /** A change of MRR rather than money received: the amount reads "+$99 MRR". */
  recurring?: boolean;
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
  amount,
  recurring,
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(0_0_0/0.55),rgb(0_0_0/0.3))]" />
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
          "relative flex w-[min(calc(var(--u)*84),92%)] flex-col items-center gap-4 overflow-hidden rounded-[calc(var(--rem)*2.5)] bg-[#0c0e11] px-16 pt-12 pb-13 text-center ring-1",
          celebration
            ? "shadow-(--moment-glow) ring-white/12"
            : "shadow-(--moment-shadow) ring-white/8",
        )}
      >
        {celebration && (
          <div className="absolute inset-x-[15%] top-0 h-px bg-linear-to-r from-transparent via-(--glow) to-transparent" />
        )}
        <Reveal delay={0.1}>
          <p
            className={cn(
              "flex items-center gap-3 text-2xl font-medium",
              celebration ? "text-(--glow-bright)" : "text-(--ink-2)",
            )}
          >
            <Icon aria-hidden className="size-[1.1em]" strokeWidth={2.2} />
            {eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <p className="flex items-baseline gap-4 text-[length:calc(var(--rem)*7.5)] leading-none font-semibold tracking-[-0.04em] tabular-nums">
            <span className={celebration ? undefined : "text-(--ink-2)"}>{amount}</span>
            {recurring && (
              <span className="text-4xl font-medium tracking-tight text-(--ink-3)">MRR</span>
            )}
          </p>
        </Reveal>
        {details.length > 0 && (
          <Reveal delay={0.26}>
            <p className="text-2xl text-balance text-(--ink-2)">{details.join(" · ")}</p>
          </Reveal>
        )}
        {footnote && (
          <Reveal delay={0.34}>
            <p className="mt-2 rounded-full bg-(--glow-wash) px-6 py-2.5 text-2xl font-medium text-(--glow-bright) tabular-nums">
              {footnote}
            </p>
          </Reveal>
        )}
      </motion.article>
    </motion.div>
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
