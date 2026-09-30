import { PlusIcon } from "lucide-react";
import { siteConfig } from "@/lib/site";

interface Question {
  question: string;
  answer: React.ReactNode;
}

const QUESTIONS: Question[] = [
  {
    question: "Is my Stripe key safe?",
    answer: (
      <>
        <p>
          You connect Stripe with a restricted key, created in your Stripe Dashboard with only the
          permissions {siteConfig.name} needs: it reads subscriptions, customers and payments, and
          changes nothing. One permission is optional: it lets {siteConfig.name} register its own
          webhook endpoint, for instant updates.
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
          Yes: {siteConfig.name} follows Stripe’s own definition of MRR. Only active and past-due
          subscriptions count, a yearly price counts for a twelfth, and discounts are subtracted,
          except one-time ones.
        </p>
        <p>
          Two cases differ, both documented: tax-inclusive prices count with their tax, and the
          chart before your first import is rebuilt from each subscription’s current amount.{" "}
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
        card or bank details. Disconnecting an account deletes its data, and self-hosted, all of it
        stays on your server.
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
        or a Raspberry Pi, and your Stripe data never leaves it.{" "}
        <FaqLink href={siteConfig.selfHostingUrl}>Self-hosting guide</FaqLink>
      </p>
    ),
  },
];

/**
 * Answers to what founders ask before connecting Stripe. Native disclosures: every answer is in
 * the page's HTML, for search engines, and opens without JavaScript.
 */
export function Faq() {
  return (
    <div className="border-t border-white/[0.08]">
      {QUESTIONS.map(({ question, answer }) => (
        <details key={question} className="group border-b border-white/[0.08]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-5 font-medium text-(--ink) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow) [&::-webkit-details-marker]:hidden">
            {question}
            <PlusIcon
              aria-hidden
              className="size-4 shrink-0 text-(--ink-3) transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
            />
          </summary>
          <div className="flex max-w-2xl flex-col gap-3 pb-6 text-pretty text-(--ink-2)">
            {answer}
          </div>
        </details>
      ))}
    </div>
  );
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
