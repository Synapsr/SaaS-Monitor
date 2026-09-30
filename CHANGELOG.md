# Changelog

Notable changes to SaaS Monitor, newest first. Versions follow [semantic versioning](https://semver.org).

## [Unreleased]

### Added

- Lost subscriptions say why, in the feed, on their card and in the voice: canceled, won't renew
  (a cancellation at period end, with the date it ends), payment failed (Stripe's retries ran
  out) or paused. Churns recorded before take the reason their subscription shows.
- A voice announcement for failed payments, on its own switch, and phrases of their own for
  subscriptions set not to renew or paused.
- Customers without a name can be named by their email, masked (`j•••@gmail.com`) or in full,
  on screens that show names and allow it.
- **Events**, in the screen settings: for each kind of event, whether it is listed in the feed,
  shown as a card, plays its sound and is said out loud, each on its own. Payments made for Stripe
  Connect accounts have their own row: they may stay off the feed, which still fills up with the
  account's own activity.
- The standalone live demo says its data is simulated and invites visitors to put their own MRR
  on the wall. Shared on X or LinkedIn, a link to it shows a preview card.
- On saas-monitor.com, moments and milestones credit "saas-monitor.com" in small print, which each
  screen can turn off. It needs `SHOW_ATTRIBUTION=true`: self-hosted servers never show it.
- The landing page's TV can be heard: **Hear it** plays the demo's sounds and voice. The sound
  board plays every voice in its own language, and a FAQ answers what founders ask before
  connecting Stripe.
- New pages: Stripe notification sounds, with every sound to download as MP3; comparisons with
  Baremetrics, ChartMogul, Geckoboard, PingBell and ProfitWell; this changelog, with an RSS feed;
  the privacy policy, terms of service and legal notice of saas-monitor.com.
- A sitemap, structured data, `llms.txt` and an Apple touch icon, for search engines and
  assistants.
- After a test celebration, the dashboard offers once to share a photo of the wall or to star the
  project. The user menu links to GitHub, the docs, the changelog and feedback.
- Optional analytics with Plausible, off unless `PLAUSIBLE_DOMAIN` is set: no cookies, events
  relayed by the app itself, ids removed from URLs, screens never counted.
- Self-hosting without cloning: `compose.yaml` runs the published image (amd64 and arm64),
  `install.sh` prepares the folder and its secrets, and `compose.build.yaml` builds from source.

### Changed

- Sound and voice settings keep to how they sound: which events play moved to **Events**. Screens
  keep the sounds and voice they had chosen.
- The Raspberry Pi guide sets a screen up with one block of commands.

### Fixed

- A screen protected by a password stays unlocked after its kiosk restarts: the kiosk command no
  longer opens Chromium in incognito mode, which forgot the password at every reboot.

## [1.1.0] - 2026-09-29

### Added

- An optional password per screen, on top of its link: each device asks for it once, in the
  screen's language, and changing it locks every device out again.
- Stripe Connect platforms: payments made for a connected account show with their own icon, and
  revenue only counts the application fee kept of them. Payments imported before are classified
  at the next **Re-import data** of the account.
- Voice announcements: a voice says what just happened, after the sound and on a switch of its
  own, for each kind of moment (payments for a connected account apart). Ten voices, two per
  language, in English, French, German, Spanish and Portuguese, with recorded phrases. With a
  Gradium API key (`GRADIUM_API_KEY`), screens say their own phrases, with the customer's name,
  the amount or the plan, and variations picked at random.

### Changed

- Moments stay on screen as long as each screen chooses (5 to 30 seconds, 10 by default, shorter
  when several arrive at once), in a larger card that reads from across the room.
- The landing page says what it costs: saas-monitor.com is free during the public beta, and
  self-hosting stays free for good.

### Fixed

- Feed rows fit a narrow column: the country is a flag at the start of the details, and the
  account sits next to the time, instead of details running past the edge.
- In development, the database sees new columns after a schema change without a restart.

## [1.0.0] - 2026-09-29

The first public release.

### Screens

- MRR or ARR in large type with its 30-day growth, progress towards the next milestone or your
  own goal with the date you'll reach it, a chart over 30 days, 90 days, 12 months or all time,
  revenue today and this month, customers, net new MRR, and a live feed of new customers,
  payments and subscription changes.
- A moment on screen for every event, confetti for money coming in, and a full-screen celebration
  at each milestone.
- Sounds in three packs synthesized in the browser: cash register, chime and arcade.
- A dark or light theme, preset accents or your own color, and seven languages (English, French,
  German, Spanish, Italian, Portuguese, Dutch) with local number and date formats.
- Several Stripe accounts per screen, added up in one currency or taking turns, each moment
  naming the product it comes from.
- Made for unattended TVs: any resolution or orientation, display kept awake, recovery from
  outages, reload after updates, protection of OLED panels.

### Stripe

- Read-only restricted keys, encrypted at rest.
- MRR as Stripe defines it: discounts, trials, cancellations at period end, billing intervals.
- A resumable import of subscriptions, a year of payments and the last week's new customers,
  then an incremental sync from the Events API: instant with webhooks, otherwise paced within
  Stripe's read allowance.
- Accounts billed in different currencies, converted with ECB rates.

### Dashboard

- Workspaces and invitations, screens with a live preview editor and test celebrations, screen
  links that can be regenerated.
- Email and password sign-in with rate limits, optional GitHub and Google sign-in, and sign-ups
  that can be closed.

### Self-hosting

- Docker Compose with MySQL 8.4, migrations on startup, and images for amd64 and arm64 on GitHub
  Container Registry.

[Unreleased]: https://github.com/Synapsr/SaaS-Monitor/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Synapsr/SaaS-Monitor/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Synapsr/SaaS-Monitor/releases/tag/v1.0.0
