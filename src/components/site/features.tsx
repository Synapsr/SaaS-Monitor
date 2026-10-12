import {
  CheckIcon,
  KeyRoundIcon,
  LayersIcon,
  MonitorIcon,
  PartyPopperIcon,
  TrendingUpIcon,
  UserPlusIcon,
} from "lucide-react";
import { CountUp } from "@/components/site/count-up";
import { Container, SectionHeading } from "@/components/site/section";
import { PRESET_ACCENTS } from "@/lib/display/accents";
import { ACCENTS } from "@/lib/screens/options";
import type { SiteText } from "@/lib/site/i18n";
import { formatDollars, formatPercent, regionName } from "@/lib/site/format";
import { cn } from "@/lib/utils";

/** The demo's figures, as the live demo shows them around its $15K goal. */
const MRR = 14_880;
const GROWTH = 2_345;
const GOAL = 15_000;
/** The demo’s two products (`?accounts=2`). */
const DEMO_ACCOUNTS = ["Acme Analytics", "Acme Mail"];

/**
 * What the wall shows, in a grid of uneven cells: the number, a sale, a milestone, then what
 * makes it a wall display. Each card draws a glimpse of the screen, in the page's language.
 */
export function Features({ text, locale }: { text: SiteText["features"]; locale: string }) {
  const goalShort = formatDollars(GOAL, locale, { compact: true });
  return (
    <section aria-labelledby="features-title" id="features" className="pt-24 sm:pt-36">
      <Container>
        <SectionHeading
          id="features-title"
          eyebrow={text.eyebrow}
          title={text.title}
          lead={text.lead}
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2" title={text.mrr.title} description={text.mrr.text}>
            <div className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3">
                <CountUp
                  value={MRR}
                  from={MRR - 930}
                  locale={locale}
                  format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
                  className="text-[clamp(3rem,2rem+4vw,4.75rem)] leading-none font-semibold tracking-[-0.04em]"
                />
                <p className="flex w-fit items-center gap-1.5 rounded-full bg-(--glow)/10 px-2.5 py-1 text-sm text-(--glow) tabular-nums">
                  <TrendingUpIcon aria-hidden className="size-4" />
                  {text.mrr.growth(
                    formatDollars(GROWTH, locale, { signed: true }),
                    formatPercent(GROWTH / (MRR - GROWTH), locale, { signed: true }),
                  )}
                </p>
              </div>
              <Sparkline />
            </div>
            <div className="mt-6">
              <div className="h-1.5 rounded-full bg-(--surface-hover)">
                <div className="h-full w-[99%] rounded-full bg-(--glow) shadow-[0_0_16px_var(--glow)]" />
              </div>
              <p className="mt-2.5 text-xs text-(--ink-3) tabular-nums">
                {text.mrr.toGoal(formatDollars(GOAL - MRR, locale), goalShort)} · {text.mrr.pace}
              </p>
            </div>
          </Card>

          <Card title={text.moment.title} description={text.moment.text}>
            <div className="relative mx-auto mt-2 w-full max-w-64 rounded-2xl bg-(--popover) px-5 py-5 text-center shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_0_60px_-10px_color-mix(in_oklab,var(--glow)_40%,transparent)]">
              <p className="flex items-center justify-center gap-1.5 text-xs text-(--glow)">
                <UserPlusIcon aria-hidden className="size-3.5" />
                {text.moment.kind}
              </p>
              <p className="mt-1.5 text-4xl font-semibold tracking-tight tabular-nums">
                {formatDollars(199, locale)}
              </p>
              <p className="mt-1.5 text-xs text-(--ink-2)">
                {text.moment.plan} · <span aria-hidden>🇳🇱</span> {regionName("NL", locale)}
              </p>
              <Confetti />
            </div>
          </Card>

          <Card title={text.milestone.title} description={text.milestone.text}>
            <div className="mt-2 flex flex-col items-center justify-center rounded-2xl bg-[radial-gradient(70%_80%_at_50%_50%,color-mix(in_oklab,var(--glow)_22%,transparent),transparent_75%)] py-6 text-center">
              <p className="flex items-center gap-1.5 text-xs text-(--glow-ink)">
                <PartyPopperIcon aria-hidden className="size-3.5" />
                {text.milestone.reached}
              </p>
              <p className="mt-1.5 text-4xl font-semibold tracking-tight">
                {formatDollars(10_000, locale, { compact: true })}{" "}
                <span className="text-xl text-(--ink-2)">MRR</span>
              </p>
              <p className="mt-1.5 text-xs text-(--ink-3)">
                {text.milestone.next(formatDollars(25_000, locale, { compact: true }))}
              </p>
            </div>
          </Card>

          <Card icon={MonitorIcon} title={text.wall.title} description={text.wall.text}>
            <ul aria-hidden className="flex gap-2">
              {ACCENTS.map((accent) => (
                <li
                  key={accent}
                  className="size-5 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]"
                  style={{ backgroundColor: PRESET_ACCENTS[accent].dark.glow }}
                />
              ))}
            </ul>
          </Card>

          <Card icon={LayersIcon} title={text.accounts.title} description={text.accounts.text}>
            <Rotation names={[text.accounts.all, ...DEMO_ACCOUNTS]} />
          </Card>

          <article className="reveal flex flex-col gap-6 rounded-3xl bg-(--surface) p-6 shadow-(--edge) sm:p-7 md:col-span-2 lg:col-span-3 lg:flex-row lg:items-center lg:gap-10">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--glow)/10 text-(--glow) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--glow)_25%,transparent)]">
              <KeyRoundIcon aria-hidden className="size-5" />
            </span>
            <div className="lg:max-w-md">
              <h3 className="text-[1.0625rem] font-medium text-balance">{text.honest.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-(--ink-2)">
                {text.honest.text}
              </p>
            </div>
            <ul className="flex flex-wrap gap-2 lg:ml-auto lg:justify-end">
              {text.honest.points.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-1.5 rounded-full bg-(--surface-raised) px-3 py-1.5 text-xs text-(--ink-2) shadow-(--edge)"
                >
                  <CheckIcon aria-hidden className="size-3.5 text-(--glow)" />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Container>
    </section>
  );
}

function Card({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "reveal flex flex-col justify-between gap-8 rounded-3xl bg-(--surface) p-6 shadow-(--edge) transition-[box-shadow,background-color] duration-200 hover:bg-(--surface-raised) hover:shadow-(--edge-hover) sm:p-7",
        className,
      )}
    >
      {Icon && (
        <span className="flex size-10 items-center justify-center rounded-xl bg-(--glow)/10 text-(--glow) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--glow)_25%,transparent)]">
          <Icon aria-hidden className="size-5" />
        </span>
      )}
      {children && <div>{children}</div>}
      <div>
        <h3 className="text-[1.0625rem] font-medium text-balance">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-(--ink-2)">{description}</p>
      </div>
    </article>
  );
}

/** The demo's MRR curve, drawn as it scrolls into view. */
function Sparkline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 80"
      className="h-20 w-full max-w-60 overflow-visible sm:w-60"
      fill="none"
    >
      <defs>
        <linearGradient id="sparkline-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--glow)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--glow)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 68 C30 66 44 60 66 58 S100 50 122 46 S160 40 178 30 S214 14 240 8 V80 H0 Z"
        fill="url(#sparkline-fill)"
      />
      <path
        className="draw"
        pathLength={1}
        d="M0 68 C30 66 44 60 66 58 S100 50 122 46 S160 40 178 30 S214 14 240 8"
        stroke="var(--glow)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="240"
        cy="8"
        r="4"
        fill="var(--glow)"
        className="drop-shadow-[0_0_6px_var(--glow)]"
      />
    </svg>
  );
}

/** A screen taking turns between the accounts, as its top bar shows it. */
function Rotation({ names }: { names: string[] }) {
  return (
    <ul aria-hidden className="flex flex-wrap gap-1.5">
      {names.map((name, index) => (
        <li
          key={name}
          className={cn(
            "relative overflow-hidden rounded-full px-3 py-1 text-xs",
            index === 0
              ? "bg-(--glow)/10 text-(--ink) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--glow)_30%,transparent)]"
              : "text-(--ink-3) shadow-(--edge)",
          )}
        >
          {name}
          {index === 0 && (
            <span className="absolute inset-x-3 bottom-0 h-px bg-linear-to-r from-(--glow) to-transparent" />
          )}
        </li>
      ))}
    </ul>
  );
}

/** A few pieces of the confetti a sale throws, around its card. */
function Confetti() {
  return (
    <>
      <span aria-hidden className="absolute -top-2 left-6 size-1.5 rotate-12 bg-(--glow)" />
      <span aria-hidden className="absolute top-3 -right-1 size-1 rounded-full bg-(--ink)/70" />
      <span
        aria-hidden
        className="absolute right-10 -bottom-1.5 h-1 w-2 -rotate-12 bg-(--glow-ink)"
      />
      <span aria-hidden className="absolute bottom-4 -left-1.5 size-1 rounded-full bg-(--glow)" />
      <span aria-hidden className="absolute -top-1 right-16 h-1 w-1.5 rotate-45 bg-(--glow-ink)" />
    </>
  );
}
