# Changelog

Notable changes to SaaS Monitor, newest first. Versions follow [semantic versioning](https://semver.org).

## [Unreleased]

### Added

- An optional password per screen, on top of its link: each device asks for it once, in the
  screen's language, and changing it locks every device out again.
- Stripe Connect platforms: payments made for a connected account show with their own icon, and
  revenue only counts the application fee kept of them.
- Voice announcements: a voice says what just happened, after the sound and on a switch of its
  own, for each kind of moment (payments for a connected account apart). Ten voices, two per
  language, in English, French, German, Spanish and Portuguese, with recorded phrases. With a
  Gradium API key (`GRADIUM_API_KEY`), screens say their own phrases, with the customer's name,
  the amount or the plan, and variations picked at random.

### Changed

- Moments stay on screen as long as each screen chooses (5 to 30 seconds, 10 by default, shorter
  when several arrive at once), in a larger card that reads from across the room.

### Fixed

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
- MRR as Stripe computes it: discounts, trials, cancellations at period end, billing intervals.
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

[Unreleased]: https://github.com/Synapsr/SaaS-Monitor/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Synapsr/SaaS-Monitor/releases/tag/v1.0.0
