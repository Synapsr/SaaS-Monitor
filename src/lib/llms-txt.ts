import { ALTERNATIVES } from "@/lib/marketing/alternatives";
import { absoluteUrl, apps, siteConfig } from "@/lib/site";
import { en as docs } from "@/lib/site/docs/en";
import { DOCS_SLUGS, DOCS_TEXT_KEYS, docsPath } from "@/lib/site/docs/pages";
import { LANGUAGE_NAMES, SITE_LANGUAGES } from "@/lib/site/languages";
import { localizedPath } from "@/lib/site/paths";

/**
 * `/llms.txt` (https://llmstxt.org): what SaaS Monitor is, for whom, how it compares and where to
 * read more, for the AI assistants founders ask for "a Stripe dashboard for a TV". Facts only,
 * Markdown, links first. `/llms-full.txt` adds the docs themselves.
 */
export function llmsTxt(appUrl: string): string {
  const page = (path: `/${string}`) => absoluteUrl(appUrl, path);
  const others = ALTERNATIVES.map((alternative) => alternative.name);
  const appStatus =
    apps.appStore.live || apps.googlePlay.live
      ? [
          apps.appStore.live && `[App Store](${apps.appStore.url})`,
          apps.googlePlay.live && `[Google Play](${apps.googlePlay.url})`,
        ]
          .filter(Boolean)
          .join(", ")
      : "in review on the App Store and Google Play";

  return `# ${siteConfig.name}

> ${siteConfig.description}

${siteConfig.name} is an open-source (MIT) Stripe dashboard made for a TV in the office. It connects to Stripe with a restricted API key that only reads (one optional permission lets it register its own webhook) and turns the account into a screen: MRR front and center, ARR, 30-day growth, revenue today and this month, a chart of MRR, the next milestone with the date it will be reached at the current pace, and a live feed of payments, new customers, upgrades and churn. Every sale plays a sound, a voice can say what happened, and milestones fill the screen with confetti. A screen is an unguessable link that any TV, monitor, tablet or Raspberry Pi opens in its browser, with no sign-in (a password is optional).

## Who it is for

SaaS founders and small teams who bill with Stripe and want their revenue visible where they work: on a wall, a desk monitor, or a phone.

## Key facts

- Price: the hosted version at ${siteConfig.hostedUrl} is free during the public beta; self-hosting is free for good (MIT license).
- Self-hosting: Docker Compose with MySQL, on any server or a Raspberry Pi with a 64-bit OS (images for amd64 and arm64), installed with two commands.
- MRR follows Stripe's own definition; the few known differences with the Stripe Dashboard are documented.
- Security: Stripe keys are encrypted at rest (AES-256-GCM) and never leave the server; customer names and emails stay off screens unless allowed.
- Updates arrive instantly through Stripe webhooks, or by polling within Stripe's read allowance.
- Several Stripe accounts can share one screen, added up in one currency or taking turns.
- Screens speak English, French, German, Spanish, Italian, Portuguese (Brazil) and Dutch, with local number and date formats; voices speak English, French, German, Spanish and Portuguese. Three sound packs: cash register, chime, arcade.
- Mobile app: SaaS Monitor for iPhone, iPad, Apple Watch, Android and Wear OS opens any screen (hosted or self-hosted) with its link or QR code, notifies each payment, new subscriber, upgrade and milestone, has widgets and watch complications, and shares any number as an image. No account, no tracking. Status: ${appStatus}.
- No ads, no analytics, no tracking on the site.
- Stripe only for now: no Paddle, Lemon Squeezy or Polar yet.

## How it compares

${siteConfig.name} does not replace subscription analytics such as Baremetrics or ChartMogul, which it runs beside: it puts the numbers on a screen that stays on, with sound. Side-by-side comparisons with ${others.slice(0, -1).join(", ")} and ${others.at(-1)}: [Alternatives](${page("/alternatives")}).

## Try it

- [Live demo](${page("/d/demo")}): a screen fed by a simulated SaaS, no account needed. Query parameters change it: \`theme=light\`, \`lang=fr\`, \`accent=ff6b35\`, \`sound=arcade\`, \`voice=sterling\`, \`metric=arr\`, \`accounts=2\`.
- [Create an account](${page("/sign-up")}): connect Stripe, then open the screen's link on a TV.
- [Stripe notification sounds](${page("/stripe-notification-sound")}): every sound to play or download as WAV.

## Docs

Short guides on the site, also in every language of the site (\`/fr/docs\`, \`/de/docs\`…):

- [Docs](${page(docsPath("overview"))}): every guide, in a minute or two each.
${DOCS_SLUGS.map((slug) => `- [${docs.common.pages[slug]}](${page(docsPath(slug))}): ${docs[DOCS_TEXT_KEYS[slug]].summary}`).join("\n")}

The technical guides, on GitHub:

- [Connect Stripe](${siteConfig.stripeDocsUrl}): the restricted key and its permissions, how MRR is computed, instant updates with webhooks.
- [Put a screen on the wall](${siteConfig.wallDisplayDocsUrl}): TVs, Raspberry Pi kiosk mode, sound, voices, languages.
- [Self-hosting](${siteConfig.selfHostingUrl}): Docker Compose, configuration, updates and backups.
- [Full docs as one file](${page("/llms-full.txt")})

## The site in other languages

${SITE_LANGUAGES.filter((language) => language !== "en")
  .map((language) => `- [${LANGUAGE_NAMES[language]}](${page(localizedPath(language, "/"))})`)
  .join("\n")}

## Project

- [Source code on GitHub](${siteConfig.repositoryUrl}): MIT license.
- [Changelog](${page("/changelog")})
- Support: ${siteConfig.supportEmail}
- Made by [${siteConfig.maker.name}](${siteConfig.maker.url}), which also makes [Louez](${siteConfig.maker.githubUrl}/Louez) and [Hovod](${siteConfig.maker.githubUrl}/Hovod), open source too.
`;
}

/** `/llms-full.txt`: `llms.txt`, then each doc whole, for assistants that read everything. */
export function llmsFullTxt(appUrl: string, docs: { title: string; markdown: string }[]): string {
  return [
    llmsTxt(appUrl),
    ...docs.map(({ title, markdown }) => `---\n\n<!-- ${title} -->\n\n${markdown.trim()}\n`),
  ].join("\n");
}
