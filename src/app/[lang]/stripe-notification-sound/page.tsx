import { ArrowRightIcon, PlayIcon } from "lucide-react";
import type { ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClosingCall } from "@/components/content/closing-call";
import { ContentPage, ContentSection, PageIntro } from "@/components/content/content-page";
import { StepsCard } from "@/components/content/steps-card";
import { buttonClass } from "@/components/site/button-styles";
import { Faq } from "@/components/site/faq";
import { JsonLd } from "@/components/site/json-ld";
import { SoundBoard } from "@/components/site/sound-board";
import { soundBoardPacks, voiceBoardProps } from "@/components/site/sound-props";
import { VoiceBoard } from "@/components/site/voice-board";
import { sitePageMetadata } from "@/lib/marketing/page-metadata";
import { siteText } from "@/lib/site/i18n";
import { INTL_LOCALES, isSiteLanguage, type SiteLanguage } from "@/lib/site/languages";
import { demoPath } from "@/lib/site/paths";
import { siteLinks } from "@/lib/site/rich-text";
import { faqPage, pageJsonLd } from "@/lib/structured-data";

const PATH = "/stripe-notification-sound";

/** Where each step comes from; Google's help reads in the page's language. */
function sources(language: SiteLanguage) {
  return {
    stripeApp: "https://docs.stripe.com/dashboard/mobile",
    stripeNotifications:
      "https://support.stripe.com/questions/enabling-notifications-on-the-stripe-dashboard-mobile-app",
    iphone: "https://support.apple.com/guide/iphone/change-notification-settings-iph7c3d96bab/ios",
    android: `https://support.google.com/android/answer/9079661?hl=${language === "pt" ? "pt-BR" : language}`,
    androidChannels: "https://developer.android.com/develop/ui/views/notifications/channels",
  };
}

export async function generateMetadata(
  { params }: PageProps<"/[lang]/stripe-notification-sound">,
  parent: ResolvingMetadata,
) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) notFound();
  const { meta } = siteText(lang).soundPage;
  return sitePageMetadata(
    { title: meta.title, description: meta.description, path: PATH, language: lang },
    parent,
  );
}

export default async function StripeNotificationSoundPage({
  params,
}: PageProps<"/[lang]/stripe-notification-sound">) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) notFound();
  const text = siteText(lang);
  const page = text.soundPage;
  const { change } = page;
  const source = sources(lang);

  return (
    <ContentPage language={lang} path={PATH}>
      <JsonLd data={pageJsonLd([faqPage(lang, PATH, page.questions.items)])} />
      <PageIntro eyebrow={page.eyebrow} title={page.title}>
        <p>{page.intro}</p>
      </PageIntro>

      <ContentSection id="change-it" title={change.title} description={<p>{change.lead}</p>}>
        <div className="grid gap-4 md:grid-cols-3">
          <StepsCard
            title={change.iphone.title}
            steps={change.iphone.steps}
            note={change.iphone.note}
            sourceLabel={change.source}
            sources={[{ href: source.iphone, label: change.iphone.sources.apple }]}
          />
          <StepsCard
            title={change.android.title}
            steps={change.android.steps}
            note={change.android.note}
            sourceLabel={change.source}
            sources={[
              { href: source.android, label: change.android.sources.android },
              { href: source.androidChannels, label: change.android.sources.developers },
            ]}
          />
          <StepsCard
            title={change.stripe.title}
            steps={change.stripe.steps}
            note={change.stripe.note}
            sourceLabel={change.source}
            sources={[
              { href: source.stripeNotifications, label: change.stripe.sources.support },
              { href: source.stripeApp, label: change.stripe.sources.app },
            ]}
          />
        </div>
      </ContentSection>

      <ContentSection
        id="sounds"
        title={page.library.title}
        description={<p>{page.library.lead}</p>}
      >
        <SoundBoard packs={soundBoardPacks(text.sounds, { files: true })} />
      </ContentSection>

      <ContentSection id="voices" title={page.voices.title} description={<p>{page.voices.lead}</p>}>
        <VoiceBoard {...voiceBoardProps(text.sounds, INTL_LOCALES[lang])} />
      </ContentSection>

      <ContentSection id="questions" title={page.questions.title}>
        <Faq items={page.questions.items} links={siteLinks(lang)} className="max-w-3xl" />
      </ContentSection>

      <ClosingCall
        title={page.closing.title}
        actions={
          <>
            <Link
              href={demoPath(lang, { sound: "register" })}
              prefetch={false}
              className={buttonClass({ size: "lg" })}
            >
              <PlayIcon aria-hidden className="fill-current" />
              {page.closing.register}
            </Link>
            <Link
              href={demoPath(lang, { sound: "arcade" })}
              prefetch={false}
              className={buttonClass({ variant: "secondary", size: "lg" })}
            >
              {page.closing.arcade}
              <ArrowRightIcon aria-hidden />
            </Link>
          </>
        }
      >
        {page.closing.text}
      </ClosingCall>
    </ContentPage>
  );
}
