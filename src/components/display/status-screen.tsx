import { CircleAlertIcon, PlugIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { ScreenMessage } from "@/components/display/screen-message";
import { LogoPulse } from "@/components/logo";
import { recurringMetric } from "@/lib/display/metric";
import type { DisplayAccount, DisplayState } from "@/lib/display/types";
import { cn } from "@/lib/utils";

const subscribeNever = () => () => {};
const dashboardUrl = () => `${window.location.host}/app`;
const noUrl = () => null;

const ACCOUNT_STATUS: Record<DisplayAccount["status"], string> = {
  ready: "imported",
  importing: "importing",
  error: "failing",
};

/** What a screen shows until it has numbers: no account yet, the first import, or broken keys. */
export function StatusScreen({ state }: { state: DisplayState }) {
  // Where to go from the TV: the address of this very server.
  const dashboard = useSyncExternalStore(subscribeNever, dashboardUrl, noUrl);

  if (state.status === "importing") {
    return (
      <ScreenMessage icon={<ImportingIcon />} title="Importing your Stripe history…">
        <p>
          Subscriptions and payments are on their way. It takes a minute or two for most accounts,
          and this screen updates by itself.
        </p>
        {state.accounts.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-3 text-xl">
            {state.accounts.map((account) => (
              <li
                key={account.id}
                className="flex items-center gap-2.5 rounded-full bg-(--surface) px-5 py-2 ring-1 ring-(--hairline)"
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-2 rounded-full",
                    account.status === "ready" && "bg-(--glow)",
                    account.status === "importing" && "bg-(--ink-3) motion-safe:animate-pulse",
                    account.status === "error" && "bg-amber-300",
                  )}
                />
                {account.name}
                <span className="text-(--ink-3)">{ACCOUNT_STATUS[account.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </ScreenMessage>
    );
  }

  if (state.status === "error") {
    return (
      <ScreenMessage
        icon={<CircleAlertIcon />}
        title="Stripe data can’t be loaded right now"
        tone="neutral"
      >
        <p>
          Every account of this screen is failing, often because an API key was revoked. Check the
          Stripe connections in your dashboard: the screen will recover by itself.
        </p>
      </ScreenMessage>
    );
  }

  return (
    <ScreenMessage icon={<PlugIcon />} title="Connect Stripe to bring this screen to life">
      <p>
        Add a Stripe account to “{state.screen.name}” in your dashboard. Your{" "}
        {recurringMetric(state.screen.settings.metric).label}, revenue and every new payment will
        show up here, live.
      </p>
      {dashboard && (
        <p className="rounded-full bg-(--surface) px-6 py-2.5 font-mono text-xl text-(--ink) ring-1 ring-(--hairline)">
          {dashboard}
        </p>
      )}
    </ScreenMessage>
  );
}

/** A highlight sweeping over the logo's pulse while the import runs. */
function ImportingIcon() {
  return (
    <span className="relative grid place-items-center">
      <LogoPulse className="h-9 text-(--ink-3) opacity-40" />
      <LogoPulse className="absolute h-9 [mask-image:linear-gradient(90deg,transparent,black_40%,black_60%,transparent)] [mask-size:200%_100%] motion-safe:animate-[display-shimmer_2.4s_linear_infinite]" />
    </span>
  );
}
