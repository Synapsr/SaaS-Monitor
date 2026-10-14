import { ArrowRightIcon, BookOpenIcon, MailIcon } from "lucide-react";
import type { ResolvingMetadata } from "next";
import Link from "next/link";
import { QrCode } from "@/components/app/screens/qr-code";
import { ContentPage, ContentSection, PageIntro } from "@/components/content/content-page";
import { buttonClass, textLinkClass } from "@/components/site/button-styles";
import { LEGAL_EMAIL } from "@/lib/legal";
import { sitePageMetadata } from "@/lib/marketing/page-metadata";
import { siteConfig } from "@/lib/site";

export function generateMetadata(_: PageProps<"/[lang]/support">, parent: ResolvingMetadata) {
  return sitePageMetadata(
    {
      title: "Support",
      description: `Help with ${siteConfig.name} and its app: write to ${siteConfig.supportEmail}, add a screen to your phone, set up notifications, report a bug or manage your data.`,
      path: "/support",
    },
    parent,
  );
}

/** The demo screen the app offers to people without SaaS Monitor, app reviewers included. */
const DEMO_URL = `${siteConfig.hostedUrl}/d/demo`;

/*
 * The support page of the site and of the apps' store listings. The app's words it quotes
 * ("Open on your phone", "Add the demo screen"…) are those of the dashboard and of apps/mobile:
 * update them together.
 */
export default function SupportPage() {
  return (
    <ContentPage path="/support">
      <PageIntro
        eyebrow="Support"
        title="How can we help?"
        actions={
          <>
            <a href={`mailto:${siteConfig.supportEmail}`} className={buttonClass({ size: "lg" })}>
              <MailIcon aria-hidden />
              Email support
            </a>
            <Link href="/docs" className={buttonClass({ variant: "secondary", size: "lg" })}>
              <BookOpenIcon aria-hidden />
              Read the docs
            </Link>
          </>
        }
      >
        <p>
          Questions about {siteConfig.name}, its apps or your account: write to{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className={textLinkClass}>
            {siteConfig.supportEmail}
          </a>
          . The people who build {siteConfig.name} read every message.
        </p>
      </PageIntro>

      <ContentSection id="help" title="Common questions">
        <ul className="grid gap-4 md:grid-cols-2">
          <Topic title="Add a screen to the app">
            <p>
              On saas-monitor.com, open a screen’s settings and choose <b>Open on your phone</b>. In
              the app, scan its QR code, or paste the screen’s link. A screen with a password asks
              for it once on each phone.
            </p>
            <p>
              The app has no account: a screen’s link is all it needs, on saas-monitor.com or on
              your own server.
            </p>
            <TopicLink href="/docs/apps">The app guide</TopicLink>
          </Topic>

          <Topic title="Try the app without an account">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <p>
                No {siteConfig.name} account yet? Tap <b>Add the demo screen</b> in the app, or scan
                this code with it: our live demo, a sample company with simulated sales.
              </p>
              <div className="w-fit shrink-0 rounded-2xl bg-white p-3">
                <QrCode value={DEMO_URL} label={`QR code of ${DEMO_URL}`} className="size-28" />
              </div>
            </div>
            <TopicLink href="/d/demo">Open the demo in your browser</TopicLink>
          </Topic>

          <Topic title="Notifications">
            <p>
              Choose which events notify in a screen’s <b>Events</b>, under <b>Phone</b>. In the
              app, each screen’s settings turn its notifications off or mute some events, and{" "}
              <b>Send a test notification</b> checks that they arrive.
            </p>
            <p>
              Nothing arrives? Allow notifications for {siteConfig.name} in your phone’s settings.
            </p>
          </Topic>

          <Topic title="Report a bug or suggest a feature">
            <p>
              {siteConfig.name} is open source: open an issue on GitHub and follow it there, or
              write to us if you’d rather not post in public.
            </p>
            <TopicLink href={`${siteConfig.repositoryUrl}/issues`}>Issues on GitHub</TopicLink>
          </Topic>

          <Topic title="Your data and your account">
            <p>
              <b>Remove from this device</b>, in a screen’s settings in the app, stops its
              notifications on the device. On saas-monitor.com, disconnecting a Stripe account
              deletes everything imported from it, and a workspace’s owner can delete it in its
              settings. To delete your account, write to{" "}
              <a href={`mailto:${LEGAL_EMAIL}`} className={textLinkClass}>
                {LEGAL_EMAIL}
              </a>
              .
            </p>
            <TopicLink href="/privacy">Privacy policy</TopicLink>
          </Topic>

          <Topic title="Self-hosting">
            <p>
              Running {siteConfig.name} on your own server? The guide covers installing, updating
              and configuring it. The apps open your instance’s screens like ours.
            </p>
            <TopicLink href="/docs/self-hosting">The self-hosting guide</TopicLink>
          </Topic>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}

function Topic({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3 rounded-3xl bg-(--surface) p-5 text-sm leading-relaxed text-pretty text-(--ink-2) shadow-(--edge) sm:p-6 [&_b]:font-medium [&_b]:text-(--ink)">
      <h3 className="text-base font-medium text-(--ink)">{title}</h3>
      {children}
    </li>
  );
}

function TopicLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    "group mt-auto flex w-fit items-center gap-1.5 pt-1 text-(--glow) outline-none focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)";
  const arrow = (
    <ArrowRightIcon
      aria-hidden
      className="size-3.5 transition-transform group-hover:translate-x-0.5"
    />
  );
  if (href.startsWith("/")) {
    return (
      <Link href={href} prefetch={false} className={className}>
        {children}
        {arrow}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
      {arrow}
    </a>
  );
}
