import {
  ArrowRightIcon,
  CircleAlertIcon,
  MinusIcon,
  PlugIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { KindIcon } from "@/components/display/feed-kind-icon";
import { LogoPulse } from "@/components/logo";
import { accentPalette, accentVariables } from "@/lib/display/accents";
import {
  screenSnapshot,
  snapshotEventText,
  type SnapshotEvent,
  type SnapshotGrowth,
} from "@/lib/display/snapshot";
import { sparkline } from "@/lib/display/sparkline";
import type { DisplayState } from "@/lib/display/types";
import type { ScreenSettings } from "@/lib/screens/settings";
import { cn } from "@/lib/utils";

/*
 * A screen in miniature: what its wall shows right now, drawn on the server from its display
 * state, in its theme, accent and language. No script, no iframe, no polling: a list of screens
 * stays light however many it has. Everything is sized in `cqw` (1% of the frame's width), like a
 * picture of the wall scaled to the card.
 */

const CHART = { width: 100, height: 40 };

/** The screen's background, theme and accent (`.wall-snapshot` in `globals.css`). */
function SnapshotFrame({
  settings,
  children,
  ...props
}: { settings: ScreenSettings } & React.ComponentProps<"div">) {
  return (
    <div
      data-theme={settings.theme}
      style={accentVariables(accentPalette(settings.accent, settings.theme)) as CSSProperties}
      className="wall-snapshot @container relative isolate aspect-video overflow-hidden rounded-lg outline -outline-offset-1 outline-black/10 dark:outline-white/10"
      {...props}
    >
      {/* The accent rising from a corner, like the wall's backdrop. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(90%_75%_at_92%_105%,color-mix(in_oklab,var(--glow)_16%,transparent),transparent_72%)]"
      />
      {children}
    </div>
  );
}

/**
 * The preview of a screen. `state` is `undefined` for a screen without a Stripe account (there is
 * nothing to load), and `null` when its state could not be loaded.
 */
export async function ScreenSnapshot({
  settings,
  state,
  editHref,
}: {
  settings: ScreenSettings;
  state: Promise<DisplayState | null> | undefined;
  editHref: string;
}) {
  if (state === undefined) return <NoAccountSnapshot settings={settings} editHref={editHref} />;
  const resolved = await state;
  if (!resolved) {
    return (
      <StatusSnapshot settings={settings} title="Preview unavailable">
        Its numbers couldn’t be loaded. Reload the page to try again.
      </StatusSnapshot>
    );
  }

  // What the frame shows comes from the state, like the wall's; the frame itself from `settings`,
  // like the skeleton before it.
  const snapshot = screenSnapshot(resolved);
  switch (snapshot.kind) {
    case "empty":
      return <NoAccountSnapshot settings={settings} editHref={editHref} />;
    case "importing":
      return <ImportingSnapshot settings={settings} />;
    case "error":
      return (
        <StatusSnapshot
          settings={settings}
          tone="warn"
          title="Stripe data can’t be loaded"
          action={
            <SnapshotLink href="/app/accounts" tone="outline">
              Check the accounts
            </SnapshotLink>
          }
        />
      );
    case "quiet":
      return (
        <SnapshotFrame settings={settings} lang={settings.language}>
          <div className="flex h-full flex-col">
            <Headline title={snapshot.title} value={snapshot.value} muted />
            <div aria-hidden="true" className="relative mt-auto mb-[17%] h-px">
              <div className="absolute inset-x-[5.5cqw] top-0 border-t border-dashed border-(--ink-3)/40" />
            </div>
          </div>
          <p className="absolute inset-x-[5.5cqw] bottom-[4.5cqw] line-clamp-2 text-[3.1cqw] leading-snug text-pretty text-(--ink-3)">
            {snapshot.caption}
          </p>
        </SnapshotFrame>
      );
    case "live":
      return (
        <SnapshotFrame settings={settings} lang={settings.language}>
          <div className="flex h-full flex-col">
            <Headline title={snapshot.title} value={snapshot.value} live>
              {snapshot.growth && <Growth growth={snapshot.growth} />}
            </Headline>
            <Sparkline series={snapshot.series} lifted={snapshot.latest !== null} />
            {snapshot.latest && <LatestEvent event={snapshot.latest} />}
          </div>
        </SnapshotFrame>
      );
  }
}

/** While the state loads: the screen's colors, and the rough shape of its numbers. */
export function SnapshotSkeleton({ settings }: { settings: ScreenSettings }) {
  return (
    <SnapshotFrame settings={settings} aria-hidden="true">
      <div className="flex flex-col gap-[2.4cqw] px-[5.5cqw] pt-[5cqw] motion-safe:animate-pulse">
        <span className="h-[3cqw] w-[34%] rounded-full bg-(--fill)" />
        <span className="h-[10cqw] w-[52%] rounded-[1.6cqw] bg-(--fill)" />
        <span className="h-[4cqw] w-[24%] rounded-full bg-(--fill)" />
      </div>
    </SnapshotFrame>
  );
}

function Headline({
  title,
  value,
  live = false,
  muted = false,
  children,
}: {
  title: string;
  value: string;
  live?: boolean;
  muted?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[1.6cqw] px-[5.5cqw] pt-[4.8cqw]">
      <div className="flex items-center justify-between gap-[3cqw]">
        <p className="truncate text-[3.2cqw] leading-tight font-medium text-(--ink-2)">{title}</p>
        {live && <LiveDot />}
      </div>
      <p
        style={{ "--characters": value.length } as CSSProperties}
        className={cn(
          // Sized from the number of characters, like the wall's: any amount fits on one line.
          "-my-[0.08em] text-[length:min(12cqw,calc(86cqw/(var(--characters)*0.56)))] leading-none font-semibold tracking-[-0.045em] whitespace-nowrap tabular-nums",
          muted && "text-(--ink-3)",
        )}
      >
        {value}
      </p>
      {children}
    </div>
  );
}

/** Calm, like the wall's: it says the numbers are current, not that something happened. */
function LiveDot() {
  return (
    <span aria-hidden="true" className="relative flex size-[1.5cqw] shrink-0">
      <span className="absolute inset-0 rounded-full bg-(--glow) opacity-50 motion-safe:animate-ping motion-safe:[animation-duration:2.6s]" />
      <span className="relative size-full rounded-full bg-(--glow)" />
    </span>
  );
}

function Growth({ growth }: { growth: SnapshotGrowth }) {
  const Icon =
    growth.trend === "up" ? TrendingUpIcon : growth.trend === "down" ? TrendingDownIcon : MinusIcon;
  return (
    <p className="flex items-center gap-[1.6cqw] text-[3cqw] leading-none">
      <span
        className={cn(
          "inline-flex items-center gap-[0.9cqw] rounded-full py-[0.9cqw] pr-[1.8cqw] pl-[1.5cqw] font-medium tabular-nums",
          growth.trend === "up"
            ? "bg-(--glow-wash) text-(--glow-ink)"
            : "bg-(--fill) text-(--ink-2)",
        )}
      >
        <Icon aria-hidden="true" className="size-[1.15em]" strokeWidth={2.25} />
        {growth.label}
      </span>
      <span className="text-(--ink-3)">{growth.period}</span>
    </p>
  );
}

/** The MRR chart's curve, from the left edge, ending on a glowing dot. */
function Sparkline({ series, lifted }: { series: number[]; lifted: boolean }) {
  const curve = sparkline(series, CHART);
  if (!curve) return null;
  return (
    <div
      aria-hidden="true"
      className={cn("relative mt-auto mr-[5.5cqw] h-[30%]", lifted ? "mb-[15cqw]" : "mb-[5cqw]")}
    >
      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
      >
        <path
          d={curve.area}
          fill="var(--glow)"
          fillOpacity="0.16"
          className="[mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <path
          d={curve.line}
          fill="none"
          stroke="var(--glow)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        style={{ left: `${curve.end.x}%`, top: `${curve.end.y}%` }}
        className="absolute size-[1.5cqw] -translate-1/2 rounded-full bg-(--glow) shadow-[0_0_0_0.9cqw_var(--glow-wash)]"
      />
    </div>
  );
}

/** The newest item of the wall's feed, as a row of it. */
function LatestEvent({ event }: { event: SnapshotEvent }) {
  const headline = event.amount ?? event.kind;
  return (
    <div className="absolute inset-x-[3cqw] bottom-[3cqw] flex items-center gap-[2cqw] rounded-[2.6cqw] bg-(--screen)/75 py-[1.6cqw] pr-[2.6cqw] pl-[1.6cqw] text-[3.1cqw] leading-tight ring-1 ring-(--hairline) backdrop-blur-sm">
      <KindIcon item={event.item} className="size-[6cqw]" />
      <p className="flex min-w-0 flex-1 items-baseline gap-[1.4cqw]">
        <span className="sr-only">{snapshotEventText(event)}</span>
        <span aria-hidden="true" className="shrink-0 font-semibold tabular-nums">
          {headline}
        </span>
        {event.amount !== null && (
          <span aria-hidden="true" className="truncate text-(--ink-2)">
            {event.kind}
          </span>
        )}
      </p>
      <span aria-hidden="true" className="shrink-0 text-(--ink-3) tabular-nums">
        {event.time}
      </span>
    </div>
  );
}

/** What the wall shows instead of numbers, said to the founder: centered, calm. */
function StatusSnapshot({
  settings,
  title,
  icon,
  tone = "neutral",
  action,
  children,
}: {
  settings: ScreenSettings;
  title: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "warn";
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <SnapshotFrame settings={settings}>
      <div className="flex h-full flex-col items-center justify-center gap-[2.6cqw] px-[8cqw] text-center">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-[9cqw] place-items-center rounded-full [&_svg]:size-[46%]",
            tone === "warn" ? "bg-(--warn)/15 text-(--warn-ink)" : "bg-(--fill) text-(--ink-2)",
          )}
        >
          {icon ?? (tone === "warn" ? <CircleAlertIcon /> : <LogoPulse />)}
        </span>
        <div className="flex flex-col gap-[1cqw]">
          <p className="text-[3.8cqw] leading-tight font-medium text-balance">{title}</p>
          {children && (
            <p className="text-[3cqw] leading-snug text-pretty text-(--ink-3)">{children}</p>
          )}
        </div>
        {action}
      </div>
    </SnapshotFrame>
  );
}

function NoAccountSnapshot({ settings, editHref }: { settings: ScreenSettings; editHref: string }) {
  return (
    <StatusSnapshot
      settings={settings}
      icon={<PlugIcon />}
      title="No Stripe account on this screen"
      action={
        <SnapshotLink href={`${editHref}#accounts`} tone="solid">
          Choose an account
        </SnapshotLink>
      }
    />
  );
}

function ImportingSnapshot({ settings }: { settings: ScreenSettings }) {
  return (
    <StatusSnapshot
      settings={settings}
      icon={<LogoPulse className="text-(--glow)" />}
      title="Importing Stripe history…"
      action={
        // Indeterminate: an import cannot know how much history is left to read.
        <span
          role="progressbar"
          aria-label="Importing Stripe history"
          className="relative h-[1cqw] w-[36%] overflow-hidden rounded-full bg-(--ink-3)/20"
        >
          <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-(--glow) motion-safe:animate-import-progress" />
        </span>
      }
    >
      The numbers appear by themselves in a minute or two.
    </StatusSnapshot>
  );
}

/**
 * An action inside the preview, above the card's own link: in the screen's inks, so that it reads
 * on either theme.
 */
function SnapshotLink({
  href,
  tone,
  children,
}: {
  href: string;
  tone: "solid" | "outline";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative z-10 inline-flex items-center gap-[1.2cqw] rounded-full px-[3.2cqw] py-[1.6cqw] text-[3.1cqw] leading-none font-medium transition-[scale,background-color,box-shadow] outline-none focus-visible:ring-[0.8cqw] focus-visible:ring-(--glow)/50 active:scale-[0.96]",
        tone === "solid"
          ? "bg-(--ink) text-(--screen) hover:bg-(--ink)/85"
          : "text-(--ink) ring-1 ring-(--ink-3)/40 hover:bg-(--fill)",
      )}
    >
      {children}
      <ArrowRightIcon aria-hidden="true" className="size-[1.1em]" />
    </Link>
  );
}
