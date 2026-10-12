import { SOCIAL_IMAGE_SIZE, socialImage } from "@/components/site/social-image";
import { siteText } from "@/lib/site/i18n";
import { DEFAULT_LANGUAGE, INTL_LOCALES, isSiteLanguage } from "@/lib/site/languages";

export const contentType = "image/png";

/** One preview per language, with its alternative text in that language. */
export async function generateImageMetadata({ params }: { params: { lang: string } }) {
  const language = isSiteLanguage(params.lang) ? params.lang : DEFAULT_LANGUAGE;
  return [
    { id: "default", alt: siteText(language).meta.imageAlt, size: SOCIAL_IMAGE_SIZE, contentType },
  ];
}

export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const language = isSiteLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  return socialImage(siteText(language), INTL_LOCALES[language]);
}
