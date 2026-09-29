import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

/** What it costs: nothing online during the public beta, nothing ever on your own server. */
export function Pricing() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PricingCard
        name="Hosted for you"
        badge="Public beta"
        price="Free"
        term="during the public beta"
        points={[
          "Every feature, nothing to install or update",
          "Instant updates from Stripe webhooks",
          "As many screens and teammates as you like",
        ]}
      >
        <Button asChild className="bg-(--ink) text-(--screen) hover:bg-white">
          <Link href="/sign-up">
            Get started
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </PricingCard>
      <PricingCard
        name="On your own server"
        badge="Open source"
        price="Free"
        term="forever, under the MIT license"
        points={[
          "Every feature, with no limits",
          "Docker in two commands, on any server or a Raspberry Pi",
          "Your Stripe data never leaves your server",
        ]}
      >
        <Button asChild variant="outline">
          <a href={siteConfig.selfHostingUrl}>Self-hosting guide</a>
        </Button>
      </PricingCard>
    </div>
  );
}

function PricingCard({
  name,
  badge,
  price,
  term,
  points,
  children,
}: {
  name: string;
  badge: string;
  price: string;
  term: string;
  points: string[];
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-6 rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/[0.08] sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">{name}</h3>
        <span className="rounded-full bg-(--glow)/10 px-2.5 py-0.5 text-xs text-(--glow) ring-1 ring-(--glow)/25">
          {badge}
        </span>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight">{price}</span>
        <span className="text-sm text-(--ink-2)">{term}</span>
      </p>
      <ul className="flex flex-col gap-2.5 text-sm text-(--ink-2)">
        {points.map((point) => (
          <li key={point} className="flex gap-2.5">
            <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-(--glow)" />
            {point}
          </li>
        ))}
      </ul>
      <div className="mt-auto">{children}</div>
    </article>
  );
}
