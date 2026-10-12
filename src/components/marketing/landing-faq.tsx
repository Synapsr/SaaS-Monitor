import { Faq, type Question } from "@/components/marketing/faq";
import { siteConfig } from "@/lib/site";

const QUESTIONS: Question[] = [
  {
    question: "Is my Stripe key safe?",
    answer: (
      <>
        <p>
          You connect Stripe with a restricted key, created in your Stripe Dashboard with only the
          permissions {siteConfig.name} needs: it reads subscriptions, customers, payments and the
          products, prices and coupons they use. One permission is optional: it lets{" "}
          {siteConfig.name} register its own webhook endpoint, for instant updates.
        </p>
        <p>
          The key is encrypted at rest with AES-256-GCM, never leaves the server and is never
          displayed again. You can revoke it in Stripe at any time.{" "}
          <FaqLink href={`${siteConfig.stripeDocsUrl}#create-the-key`}>
            See every permission
          </FaqLink>
        </p>
      </>
    ),
  },
  {
    question: "Does the number match my Stripe Dashboard?",
    answer: (
      <>
        <p>
          Yes, in most cases: {siteConfig.name} follows Stripe’s own definition of MRR. Only active
          and past-due subscriptions count, a yearly price counts for a twelfth, and discounts are
          subtracted, except one-time ones.
        </p>
        <p>
          A few limits are documented: tax-inclusive prices count with their tax, a coupon deleted
          before your first import counts on the whole subscription, and the chart before that
          import is rebuilt from each subscription’s current amount.{" "}
          <FaqLink href={`${siteConfig.stripeDocsUrl}#how-mrr-is-computed`}>
            How MRR is computed
          </FaqLink>
        </p>
      </>
    ),
  },
  {
    question: "What do you store?",
    answer: (
      <p>
        Your Stripe key, encrypted, and a copy of what your screens need: subscriptions and their
        MRR changes, payments and new customers, with customers’ names, emails and countries. No
        card or bank details. Disconnecting an account deletes its data. Self-hosted, it all stays
        on your server, apart from custom voice phrases, if you turn them on, which go to Gradium,
        and notifications to the phones that follow a screen, which go through Expo’s push service.
      </p>
    ),
  },
  {
    question: "Which TVs work?",
    answer: (
      <p>
        Any screen with a modern browser. A Raspberry Pi 4 or 5 behind the TV gives the smoothest
        result: set up once, it opens the screen full screen, with sound, at every start. A smart
        TV’s browser, a spare laptop or a tablet work too. The screen keeps itself awake, recovers
        from network outages and reloads after updates.{" "}
        <FaqLink href={siteConfig.wallDisplayDocsUrl}>Put a screen on the wall</FaqLink>
      </p>
    ),
  },
  {
    question: "Paddle, Lemon Squeezy or Polar?",
    answer: (
      <p>
        Not yet: {siteConfig.name} reads Stripe only, for now. If you use another one,{" "}
        <FaqLink href={`${siteConfig.repositoryUrl}/issues`}>say so on GitHub</FaqLink>.
      </p>
    ),
  },
  {
    question: "How much does it cost?",
    answer: (
      <p>
        The hosted version is free during the public beta. On your own server, it’s free for good:{" "}
        {siteConfig.name} is open source under the MIT license.
      </p>
    ),
  },
  {
    question: "Can I self-host?",
    answer: (
      <p>
        Yes. {siteConfig.name} runs with Docker Compose, next to its MySQL database, on any server
        or a Raspberry Pi with a 64-bit OS. Your Stripe data stays on it; only the optional custom
        voice phrases are sent to Gradium to be spoken, and phone notifications go through Expo’s
        push service. <FaqLink href={siteConfig.selfHostingUrl}>Self-hosting guide</FaqLink>
      </p>
    ),
  },
];

/** Answers to what founders ask before connecting Stripe. */
export function LandingFaq() {
  return <Faq items={QUESTIONS} />;
}

function FaqLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="whitespace-nowrap text-(--ink) underline decoration-white/25 underline-offset-4 transition-colors hover:decoration-(--glow)"
    >
      {children}
    </a>
  );
}
