import { Maximize2Icon, Minimize2Icon } from "lucide-react";
import { AudioPrompt } from "@/components/display/audio-prompt";
import { LogoPulse } from "@/components/logo";
import { useDisplayLocale } from "@/hooks/use-display-locale";
import { useNow } from "@/hooks/use-now";
import { TOTAL } from "@/lib/display/rotation";
import { formatClock } from "@/lib/display/time";
import type { DisplayAccount } from "@/lib/display/types";
import { cn } from "@/lib/utils";

/** Where a screen rotating between its accounts stands (see `src/lib/display/rotation.ts`). */
export interface RotationStatus {
  slides: readonly string[];
  slide: string;
  /** Changes with every turn, restarted ones included. */
  turn: number;
  seconds: number;
  /** A moment holds the slide on screen. */
  paused: boolean;
}

interface TopBarProps {
  name: string;
  accounts: DisplayAccount[];
  /** Several combined accounts are named, once their data shows (the import screen lists them). */
  showAccounts: boolean;
  rotation: RotationStatus | null;
  online: boolean;
  timeZone: string;
  serverTime: number;
  fullscreen: { active: boolean; supported: boolean; toggle: () => void } | null;
  /** Sound is on but the browser still waits for a first click. */
  soundPrompt: boolean;
  /** Controls fade away with the cursor when nobody is around. */
  idle: boolean;
}

export function TopBar({
  name,
  accounts,
  showAccounts,
  rotation,
  online,
  timeZone,
  serverTime,
  fullscreen,
  soundPrompt,
  idle,
}: TopBarProps) {
  const { text } = useDisplayLocale();
  const testMode = accounts.some((account) => !account.livemode);
  const fullscreenLabel = fullscreen?.active
    ? text.topBar.exitFullScreen
    : text.topBar.enterFullScreen;
  return (
    <header className="flex items-center justify-between gap-10">
      <div className="flex min-w-0 items-center gap-4">
        <LogoPulse className="h-6 text-(--glow)" />
        <h1 className="truncate text-2xl font-medium tracking-tight">{name}</h1>
        {showAccounts && rotation && <RotationPills rotation={rotation} accounts={accounts} />}
        {showAccounts && !rotation && accounts.length > 1 && (
          <ul aria-label={text.topBar.accounts} className="flex min-w-0 gap-2 overflow-hidden">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex shrink-0 items-center gap-2 rounded-full bg-(--surface) px-3.5 py-1 text-base text-(--ink-2) ring-1 ring-(--hairline)"
              >
                {account.status !== "ready" && (
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 rounded-full",
                      account.status === "error" ? "bg-(--warn)" : "bg-(--ink-3)",
                    )}
                  />
                )}
                {account.name}
                {account.status !== "ready" && (
                  <span className="sr-only"> ({text.accountStatus[account.status]})</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {testMode && (
          <span className="shrink-0 rounded-full px-3.5 py-1 text-base text-(--warn-ink) ring-1 ring-(--warn-ink)/30">
            {text.topBar.testData}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-9">
        <AudioPrompt visible={soundPrompt} />
        <LiveIndicator online={online} />
        <Clock timeZone={timeZone} serverTime={serverTime} />
        {fullscreen?.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            aria-label={fullscreenLabel}
            title={`${fullscreenLabel} (F)`}
            className={cn(
              "-mr-2.5 grid size-11 place-items-center rounded-full text-(--ink-2) transition-[opacity,background-color,scale] duration-300 hover:bg-(--fill-hover) hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow) focus-visible:outline-none active:scale-[0.96]",
              idle && "pointer-events-none opacity-0",
            )}
          >
            {fullscreen.active ? (
              <Minimize2Icon aria-hidden className="size-5" />
            ) : (
              <Maximize2Icon aria-hidden className="size-5" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}

/** The slides of the rotation, the one on screen lit, and filling up until the next turn. */
function RotationPills({
  rotation,
  accounts,
}: {
  rotation: RotationStatus;
  accounts: DisplayAccount[];
}) {
  const { text } = useDisplayLocale();
  return (
    <ol aria-label={text.topBar.accounts} className="flex min-w-0 gap-2 overflow-hidden">
      {rotation.slides.map((slide) => {
        const active = slide === rotation.slide;
        const name =
          slide === TOTAL
            ? text.allAccounts
            : accounts.find((account) => account.id === slide)?.name;
        return (
          <li
            key={slide}
            aria-current={active || undefined}
            className={cn(
              "relative flex shrink-0 items-center overflow-hidden rounded-full px-3.5 py-1 text-base ring-1 transition-[background-color,color,box-shadow] duration-500",
              active
                ? "bg-(--glow-wash) font-medium text-(--ink) ring-(--glow)/40"
                : "bg-(--surface) text-(--ink-3) ring-(--hairline)",
            )}
          >
            {name}
            {active && !rotation.paused && (
              <span
                key={rotation.turn}
                aria-hidden
                style={{ animationDuration: `${rotation.seconds}s` }}
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[display-turn_linear_forwards] bg-(--glow)"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function LiveIndicator({ online }: { online: boolean }) {
  const { text } = useDisplayLocale();
  return (
    <p role="status" className="flex items-center gap-3 text-xl">
      <span className="relative flex size-2.5">
        {online && (
          <span className="absolute inset-0 rounded-full bg-(--glow) motion-safe:animate-[display-ping_2.6s_cubic-bezier(0,0,0.2,1)_infinite]" />
        )}
        <span
          className={cn(
            "relative size-2.5 rounded-full transition-colors duration-500",
            online ? "bg-(--glow)" : "bg-(--warn)",
          )}
        />
      </span>
      <span className={online ? "text-(--ink-2)" : "text-(--warn-ink)"}>
        {online ? text.topBar.live : text.topBar.reconnecting}
      </span>
    </p>
  );
}

function Clock({ timeZone, serverTime }: { timeZone: string; serverTime: number }) {
  const { locale } = useDisplayLocale();
  const now = useNow(serverTime, 1_000);
  const { time, date } = formatClock(new Date(now), timeZone, locale);
  return (
    <p className="flex items-baseline gap-4 whitespace-nowrap">
      <span className="text-xl text-(--ink-3) portrait:hidden">{date}</span>
      <time
        dateTime={new Date(now).toISOString()}
        className="font-mono text-2xl font-medium tracking-tight tabular-nums"
      >
        {time}
      </time>
    </p>
  );
}
