import { absoluteUrl, siteConfig } from "@/lib/site";

/**
 * `/llms.txt` (https://llmstxt.org): what SaaS Monitor is and where to read more, for the AI
 * assistants founders ask for "a Stripe dashboard for a TV". Markdown, links first.
 */
export function llmsTxt(appUrl: string): string {
  const page = (path: `/${string}`) => absoluteUrl(appUrl, path);
  return `# ${siteConfig.name}

> ${siteConfig.description}

${siteConfig.name} is an open-source Stripe dashboard for the office TV. It connects to Stripe with a restricted API key that only reads (one optional permission lets it register its own webhook) and turns your account into a screen: MRR front and center, revenue, a live feed of payments, new customers and subscription changes, a sound for every sale, a voice that says what happened, and confetti for milestones. A screen is an unguessable link that any TV, monitor, tablet or Raspberry Pi opens in its browser, with no sign-in (a password is optional).

- MRR follows Stripe's own definition, so the screen matches the Stripe Dashboard.
- Stripe keys are encrypted at rest (AES-256-GCM) and never leave the server.
- Screens speak English, French, German, Spanish, Italian, Portuguese and Dutch; voices speak English, French, German, Spanish and Portuguese.
- Open source under the MIT license. The hosted version is free during the public beta; self-hosting with Docker is free for good.
- Stripe only for now: no Paddle, Lemon Squeezy or Polar yet.

## Try it

- [Live demo](${page("/d/demo")}): a screen fed by a simulated SaaS, no account needed. Query parameters change it: \`theme=light\`, \`lang=fr\`, \`accent=ff6b35\`, \`sound=arcade\`, \`voice=marius\`, \`metric=arr\`, \`accounts=2\`.
- [Create an account](${page("/sign-up")}): connect Stripe, then open the screen's link on a TV.
- [Stripe notification sounds](${page("/stripe-notification-sound")})

## Docs

- [Connect Stripe](${siteConfig.stripeDocsUrl}): the restricted key and its permissions, how MRR is computed, instant updates with webhooks.
- [Put a screen on the wall](${siteConfig.wallDisplayDocsUrl}): TVs, Raspberry Pi kiosk mode, sound, voices, languages.
- [Self-hosting](${siteConfig.selfHostingUrl}): Docker Compose, configuration, updates and backups.

## Project

- [Source code on GitHub](${siteConfig.repositoryUrl}): MIT license.
- [Changelog](${page("/changelog")})
- [Alternatives](${page("/alternatives")})
- Made by [${siteConfig.maker.name}](${siteConfig.maker.url}), in Brest, France.
`;
}
