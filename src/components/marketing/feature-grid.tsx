import {
  LayersIcon,
  MonitorIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UserPlusIcon,
} from "lucide-react";

/** What the wall screen does, each with a glimpse of it. */
export function FeatureGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <FeatureCard
        title="The number that matters, huge"
        description="MRR front and center, with its 30-day growth, ARR and your progress to the next milestone. Readable from across the room."
      >
        <div className="flex flex-col gap-3">
          <p className="text-5xl font-semibold tracking-tight tabular-nums">
            <span className="mr-0.5 align-[0.45em] text-2xl font-medium text-(--ink-2)">$</span>
            14,880
          </p>
          <p className="flex items-center gap-1.5 text-sm text-(--glow)">
            <TrendingUpIcon aria-hidden className="size-4" />
            +$2,345 · +19% in 30 days
          </p>
          <div className="mt-1 h-1.5 rounded-full bg-white/10">
            <div className="h-full w-[96%] rounded-full bg-(--glow) shadow-[0_0_16px_var(--glow)]" />
          </div>
          <p className="text-xs text-(--ink-3)">$120 to $15K · at this pace: tomorrow</p>
        </div>
      </FeatureCard>

      <FeatureCard
        title="Every sale is a moment"
        description="A satisfying sound, a card with the amount and the plan, confetti in your color. The whole office knows."
      >
        <div className="relative rounded-xl bg-[#101216] px-5 py-4 text-center shadow-[0_0_60px_-10px_rgb(52_211_153/0.35)] ring-1 ring-white/10">
          <p className="flex items-center justify-center gap-1.5 text-xs text-(--glow)">
            <UserPlusIcon aria-hidden className="size-3.5" />
            New customer
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">$199</p>
          <p className="mt-1 text-xs text-(--ink-2)">Team · 🇳🇱 Netherlands</p>
          <span aria-hidden className="absolute -top-2 left-6 size-1.5 rotate-12 bg-(--glow)" />
          <span aria-hidden className="absolute top-3 -right-1 size-1 rounded-full bg-white/70" />
          <span
            aria-hidden
            className="absolute right-10 -bottom-1.5 h-1 w-2 -rotate-12 bg-(--glow-bright)"
          />
          <span
            aria-hidden
            className="absolute bottom-4 -left-1.5 size-1 rounded-full bg-(--glow)"
          />
        </div>
      </FeatureCard>

      <FeatureCard
        title="Milestones worth celebrating"
        description="$1K, $10K, $100K MRR… or your own goal, with the date you will reach it at your current pace. Crossing one fills the screen."
      >
        <div className="flex h-full flex-col items-center justify-center rounded-xl bg-[radial-gradient(70%_80%_at_50%_50%,rgb(52_211_153/0.22),transparent_75%)] py-5 text-center">
          <p className="text-xs text-(--glow-bright)">🎉 Goal reached</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">
            $10K <span className="text-xl text-(--ink-2)">MRR</span>
          </p>
          <p className="mt-1 text-xs text-(--ink-3)">Next stop: $25K. Keep going.</p>
        </div>
      </FeatureCard>

      <CompactFeature
        icon={MonitorIcon}
        title="Made for the wall"
        description="Scales from a 720p monitor to a 4K TV, never sleeps, recovers from outages and updates itself. Runs great on a Raspberry Pi."
      />
      <CompactFeature
        icon={LayersIcon}
        title="All your products, one screen"
        description="Combine several Stripe accounts converted to one currency, or give each product its own screen and sounds."
      />
      <CompactFeature
        icon={ShieldCheckIcon}
        title="Honest and private"
        description="The same MRR as your Stripe dashboard, from a read-only key encrypted at rest. Customer names stay hidden unless you want them."
      />
    </div>
  );
}

function FeatureCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-6 rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/[0.08]">
      <div className="flex min-h-40 flex-col justify-center">{children}</div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1.5 text-sm text-pretty text-(--ink-2)">{description}</p>
      </div>
    </article>
  );
}

function CompactFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/[0.08]">
      <Icon aria-hidden className="size-5 text-(--glow)" />
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1.5 text-sm text-pretty text-(--ink-2)">{description}</p>
    </article>
  );
}
