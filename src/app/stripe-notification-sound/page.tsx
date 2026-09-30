import { ArrowRightIcon, PlayIcon } from "lucide-react";
import type { ResolvingMetadata } from "next";
import Link from "next/link";
import { ClosingCall } from "@/components/content/closing-call";
import { ContentPage, ContentSection, PageIntro } from "@/components/content/content-page";
import { Faq } from "@/components/content/faq";
import { SoundLibrary } from "@/components/content/sound-library";
import { StepsCard } from "@/components/content/steps-card";
import { VoiceBoard } from "@/components/content/voice-board";
import { Button } from "@/components/ui/button";
import { contentMetadata } from "@/lib/marketing/page-metadata";

const SOURCES = {
  stripeApp: {
    href: "https://docs.stripe.com/dashboard/mobile",
    label: "Stripe Dashboard mobile app",
  },
  stripeNotifications: {
    href: "https://support.stripe.com/questions/enabling-notifications-on-the-stripe-dashboard-mobile-app",
    label: "Stripe support",
  },
  iphone: {
    href: "https://support.apple.com/guide/iphone/change-notification-settings-iph7c3d96bab/ios",
    label: "Apple support",
  },
  android: {
    href: "https://support.google.com/android/answer/9079661?hl=en",
    label: "Android help",
  },
  androidChannels: {
    href: "https://developer.android.com/develop/ui/views/notifications/channels",
    label: "Android developers",
  },
};

export function generateMetadata(
  _: PageProps<"/stripe-notification-sound">,
  parent: ResolvingMetadata,
) {
  return contentMetadata(
    {
      title: "Stripe notification sound: how to change it",
      description:
        "Stripe’s app documents no sound setting: your phone picks the sound. How to change it on iPhone and Android, plus free cha-ching sounds for every sale.",
      path: "/stripe-notification-sound",
    },
    parent,
  );
}

export default function StripeNotificationSoundPage() {
  return (
    <ContentPage>
      <PageIntro
        eyebrow="Stripe notification sound"
        title="How to change the Stripe notification sound"
      >
        <p>
          Short answer: in your phone’s settings, not in Stripe. The Stripe Dashboard app notifies
          you of new payments, new customers, disputed payments, deposited transfers and a daily
          summary. The settings Stripe documents turn them on or off; how they sound is up to your
          phone.
        </p>
      </PageIntro>

      <ContentSection
        id="change-it"
        title="Change it on your phone"
        description="First allow notifications from Stripe on your phone, as Stripe asks. Then:"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StepsCard
            title="On iPhone"
            steps={[
              <>
                Open <strong className="text-(--ink)">Settings</strong>, then{" "}
                <strong className="text-(--ink)">Notifications</strong>.
              </>,
              <>
                Tap <strong className="text-(--ink)">Stripe</strong>, below Notification Style.
              </>,
              <>
                Tap <strong className="text-(--ink)">Sounds</strong>, then pick a sound.
              </>,
            ]}
            note="Apple notes that the last step works only if the app supports it."
            sources={[SOURCES.iphone]}
          />
          <StepsCard
            title="On Android"
            steps={[
              <>
                Open <strong className="text-(--ink)">Settings</strong>, then{" "}
                <strong className="text-(--ink)">Notifications</strong> ›{" "}
                <strong className="text-(--ink)">App notifications</strong>.
              </>,
              <>
                Tap <strong className="text-(--ink)">Stripe</strong>, then a category of its
                notifications.
              </>,
              <>Choose the sound of that category.</>,
            ]}
            note="Android lets you change the sound of each category of an app’s notifications. Menus vary from one phone maker to another."
            sources={[SOURCES.android, SOURCES.androidChannels]}
          />
          <StepsCard
            title="In the Stripe app"
            steps={[
              <>Tap your account’s icon, at the top left of any screen.</>,
              <>
                Open <strong className="text-(--ink)">Global settings</strong> ›{" "}
                <strong className="text-(--ink)">Notification settings</strong>.
              </>,
              <>Turn notifications on or off for each of your accounts.</>,
            ]}
            note="Stripe documents these switches, and no choice of sound."
            sources={[SOURCES.stripeNotifications, SOURCES.stripeApp]}
          />
        </div>
      </ContentSection>

      <ContentSection
        id="sounds"
        title="Or give every sale a sound the whole room hears"
        description={
          <p>
            A phone’s ping is easy to miss, and only you hear it. SaaS Monitor puts your Stripe
            revenue on a screen in the office and plays a sound for every payment, new customer and
            change of MRR, from one of three packs. Play them here, or download them as MP3 files,
            free to use under the MIT license.
          </p>
        }
      >
        <SoundLibrary />
      </ContentSection>

      <ContentSection
        id="voices"
        title="And a voice that says what happened"
        description={
          <p>
            After the sound, a screen can say the moment out loud, in English, French, German,
            Spanish or Portuguese. Ten voices, two per language, with recorded phrases; with a
            Gradium API key on the server, screens can also say the customer’s name, the amount or
            the plan.
          </p>
        }
      >
        <VoiceBoard />
      </ContentSection>

      <ContentSection id="questions" title="Questions">
        <Faq
          items={[
            {
              question: "Can I change the sound inside the Stripe app?",
              answer:
                "Stripe’s documentation of its Dashboard app describes switches to turn notifications on or off for each account, and no choice of sound. The sound comes from your phone’s notification settings.",
            },
            {
              question: "Which Stripe events play a sound on SaaS Monitor?",
              answer:
                "Payments, new customers, MRR going up (new subscriptions, upgrades, reactivations) or down (downgrades, cancellations, subscriptions left unpaid), and milestones: five sounds per pack. For each kind of event, a screen chooses whether it plays its sound, says it out loud, shows a card or lists it in the feed.",
            },
            {
              question: "Does SaaS Monitor replace the Stripe app?",
              answer:
                "No. It reads your Stripe account with a restricted key (one optional permission adds its own webhook) to show your revenue on a screen. Keep the Stripe app for refunds, payouts and everything else.",
            },
            {
              question: "Do I need to install anything to hear the sounds?",
              answer:
                "No. Screens synthesize their sounds in the browser: open a screen’s link on a TV, a Raspberry Pi or a laptop, and click once to allow sound.",
            },
            {
              question: "Can I use the MP3 files elsewhere?",
              answer:
                "Yes. They are rendered from SaaS Monitor’s open-source code, under the MIT license: use them in your own alerts, bots or videos.",
            },
          ]}
        />
      </ContentSection>

      <ClosingCall
        title="Hear it on a wall"
        actions={
          <>
            <Button
              asChild
              size="lg"
              className="h-11 bg-(--ink) px-5 text-(--screen) hover:bg-white"
            >
              <Link href="/d/demo?sound=register">
                <PlayIcon data-icon="inline-start" className="fill-current" />
                Open the demo with the cash register
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5">
              <Link href="/d/demo?sound=arcade">
                Or with the arcade
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </>
        }
      >
        The live demo runs a fictional SaaS with a sale every few seconds. Click once on the screen
        to turn the sound on.
      </ClosingCall>
    </ContentPage>
  );
}
