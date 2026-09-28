import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { ModeBadge, SyncStatus } from "@/components/app/accounts/account-status";
import { CopyField } from "@/components/app/copy-button";
import { NewScreenButton } from "@/components/app/screens/new-screen-button";
import { ScreenPreview } from "@/components/app/screens/screen-preview";
import { TvSetupSteps } from "@/components/app/screens/tv-setup";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Screen } from "@/server/screens";
import type { StripeAccountSummary } from "@/server/stripe/accounts";

type StepState = "done" | "current" | "upcoming";

/**
 * The three steps from sign-up to a live screen: connect Stripe, get a screen (created
 * automatically), put it on a TV.
 */
export function SetupGuide({
  account,
  screen,
  url,
}: {
  account: StripeAccountSummary | null;
  screen: Screen | null;
  url: string | null;
}) {
  const doneCount = Number(Boolean(account)) + Number(Boolean(screen));
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Getting started · {doneCount} of 3 done
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Let’s put your MRR on the wall
        </h1>
        <p className="text-pretty text-muted-foreground">
          Three steps, about two minutes. Then every sale plays a sound in the office.
        </p>
      </header>

      <ol className="flex flex-col">
        <SetupStep number={1} title="Connect Stripe" state={account ? "done" : "current"}>
          {account ? (
            <div className="flex flex-col gap-1 text-sm">
              <p className="flex items-center gap-2">
                <span className="font-medium">{account.name}</span>
                <ModeBadge livemode={account.livemode} />
              </p>
              <p>
                <SyncStatus account={account} />
              </p>
            </div>
          ) : (
            <StepCard>
              <p className="text-sm text-pretty text-muted-foreground">
                Create a read-only key in Stripe and paste it here. We import your subscriptions and
                payments, then keep them in sync.
              </p>
              <Button asChild size="lg" className="self-start">
                <Link href="/app/accounts/new">
                  Connect Stripe
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </StepCard>
          )}
        </SetupStep>

        <SetupStep
          number={2}
          title="Your screen is ready"
          state={screen ? "done" : account ? "current" : "upcoming"}
        >
          {screen ? (
            <StepCard className="sm:flex-row sm:items-center sm:gap-5">
              <ScreenPreview
                token={screen.publicToken}
                name={screen.name}
                settings={screen.settings}
                className="w-full shrink-0 sm:w-64"
              />
              <div className="flex flex-col gap-3">
                <p className="text-sm text-pretty text-muted-foreground">
                  <span className="font-medium text-foreground">{screen.name}</span> shows your MRR,
                  revenue and every new sale, with sounds and confetti.
                </p>
                <Button asChild variant="outline" className="self-start">
                  <Link href={`/app/screens/${screen.id}`}>Customize</Link>
                </Button>
              </div>
            </StepCard>
          ) : account ? (
            <StepCard>
              <p className="text-sm text-muted-foreground">
                Create a screen to choose what the TV shows.
              </p>
              <NewScreenButton label="Create a screen" />
            </StepCard>
          ) : (
            <p className="text-sm text-muted-foreground">
              We set it up for you as soon as Stripe is connected.
            </p>
          )}
        </SetupStep>

        <SetupStep number={3} title="Put it on your TV" state={screen ? "current" : "upcoming"}>
          {screen && url ? (
            <StepCard className="gap-5">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-pretty text-muted-foreground">
                  Open this link on the TV. It is private: anyone who has it can see the screen.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <CopyField value={url} label="Screen link" className="sm:flex-1" />
                  <Button asChild size="lg">
                    <a href={url} target="_blank" rel="noreferrer">
                      Open screen
                      <ArrowUpRightIcon data-icon="inline-end" />
                    </a>
                  </Button>
                </div>
              </div>
              <TvSetupSteps url={url} />
              <div className="flex justify-end border-t pt-4">
                <Button asChild variant="ghost">
                  <Link href="/app">
                    Go to the dashboard
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </StepCard>
          ) : (
            <p className="text-sm text-muted-foreground">
              Any browser works: smart TV, spare laptop or Raspberry Pi.
            </p>
          )}
        </SetupStep>
      </ol>
    </div>
  );
}

function SetupStep({
  number,
  title,
  state,
  children,
}: {
  number: number;
  title: string;
  state: StepState;
  children: React.ReactNode;
}) {
  return (
    <li
      aria-current={state === "current" ? "step" : undefined}
      className="group/step relative flex gap-4 pb-10 last:pb-0"
    >
      <span
        aria-hidden="true"
        className="absolute top-10 bottom-2 left-4 w-px -translate-x-1/2 bg-border group-last/step:hidden"
      />
      <StepIndicator number={number} state={state} />
      <div className="flex min-w-0 flex-1 flex-col gap-3 pt-1.5">
        <h2
          className={cn(
            "font-medium tracking-tight",
            state === "upcoming" && "text-muted-foreground",
          )}
        >
          {title}
          {state === "done" && <span className="sr-only"> (done)</span>}
        </h2>
        {children}
      </div>
    </li>
  );
}

function StepIndicator({ number, state }: { number: number; state: StepState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums",
        state === "done" && "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950",
        state === "current" && "bg-foreground text-background ring-4 ring-foreground/10",
        state === "upcoming" && "text-muted-foreground ring-1 ring-border ring-inset",
      )}
    >
      {state === "done" ? <CheckIcon className="size-4" strokeWidth={2.5} /> : number}
    </span>
  );
}

function StepCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5",
        className,
      )}
      {...props}
    />
  );
}
