import { Maximize2, Minimize2 } from "lucide-react";
import { AudioPrompt } from "@/components/display/audio-prompt";
import { LogoPulse } from "@/components/logo";
import { useNow } from "@/lib/display/hooks/use-now";
import { formatClock } from "@/lib/display/time";
import type { DisplayAccount } from "@/lib/display/types";
import { cn } from "@/lib/utils";

interface TopBarProps {
  name: string;
  accounts: DisplayAccount[];
  /** Several combined accounts are named, once their data shows (the import screen lists them). */
  showAccounts: boolean;
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
  online,
  timeZone,
  serverTime,
  fullscreen,
  soundPrompt,
  idle,
}: TopBarProps) {
  const testMode = accounts.some((account) => !account.livemode);
  return (
    <header className="flex items-center justify-between gap-10">
      <div className="flex min-w-0 items-center gap-4">
        <LogoPulse className="h-6 text-(--glow)" />
        <h1 className="truncate text-2xl font-medium tracking-tight">{name}</h1>
        {showAccounts && accounts.length > 1 && (
          <ul aria-label="Stripe accounts" className="flex min-w-0 gap-2 overflow-hidden">
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
                      account.status === "error" ? "bg-amber-300" : "bg-(--ink-3)",
                    )}
                  />
                )}
                {account.name}
                {account.status !== "ready" && (
                  <span className="sr-only">
                    {account.status === "error" ? " (failing)" : " (importing)"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {testMode && (
          <span className="shrink-0 rounded-full px-3.5 py-1 text-base text-amber-200 ring-1 ring-amber-200/30">
            Test data
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
            aria-label={fullscreen.active ? "Exit full screen" : "Enter full screen"}
            title={`${fullscreen.active ? "Exit" : "Enter"} full screen (F)`}
            className={cn(
              "-mr-2.5 grid size-11 place-items-center rounded-full text-(--ink-2) transition-[opacity,background-color,scale] duration-300 hover:bg-white/8 hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow) focus-visible:outline-none active:scale-[0.96]",
              idle && "pointer-events-none opacity-0",
            )}
          >
            {fullscreen.active ? (
              <Minimize2 aria-hidden className="size-5" />
            ) : (
              <Maximize2 aria-hidden className="size-5" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}

function LiveIndicator({ online }: { online: boolean }) {
  return (
    <p role="status" className="flex items-center gap-3 text-xl">
      <span className="relative flex size-2.5">
        {online && (
          <span className="absolute inset-0 rounded-full bg-(--glow) motion-safe:animate-[display-ping_2.6s_cubic-bezier(0,0,0.2,1)_infinite]" />
        )}
        <span
          className={cn(
            "relative size-2.5 rounded-full transition-colors duration-500",
            online ? "bg-(--glow)" : "bg-amber-300",
          )}
        />
      </span>
      <span className={online ? "text-(--ink-2)" : "text-amber-200"}>
        {online ? "Live" : "Reconnecting…"}
      </span>
    </p>
  );
}

function Clock({ timeZone, serverTime }: { timeZone: string; serverTime: number }) {
  const now = useNow(serverTime, 1_000);
  const { time, date } = formatClock(new Date(now), timeZone);
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
