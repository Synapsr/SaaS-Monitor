<div align="center">

<img src="src/app/icon.svg" width="64" height="64" alt="" />

# SaaS Monitor

**Your MRR, live on the wall.**

Open-source Stripe dashboard for SaaS founders: put your revenue on a TV and hear every sale.

[Live demo](#try-it) · [Self-host](docs/self-hosting.md) · [Connect Stripe](docs/stripe.md) · [Put it on a TV](docs/wall-display.md)

<br />

<img src="docs/assets/screen.webp" alt="A SaaS Monitor screen: MRR in large type, growth, goal progress, MRR chart, revenue tiles and a live activity feed" />

</div>

## Why

Building a SaaS is a long game, and the numbers that keep you going are buried in a dashboard
you rarely open. SaaS Monitor turns your Stripe account into a screen for the office, your desk or
a Raspberry Pi behind a TV: the MRR ticks up when a customer subscribes, a cash register rings
when a payment lands, and confetti flies when you cross $10K MRR.

<table>
  <tr>
    <td width="50%"><img src="docs/assets/moment.webp" alt="A new customer appears in a large card with confetti" /></td>
    <td width="50%"><img src="docs/assets/milestone.webp" alt="A full-screen celebration: goal reached, $15K MRR" /></td>
  </tr>
</table>

## Features

- **Live metrics**: MRR, or ARR if that's how you count, with its 30-day growth; revenue today and
  this month, customers, net new MRR, and a feed of every payment, upgrade and churn.
- **A history chart** over the last 30 days, 90 days, 12 months or all time, with your next goal on
  its horizon.
- **Sounds for every event**: payments, MRR up, MRR down and milestones, in three packs (cash
  register, chime, arcade) synthesized in the browser.
- **Celebrations and goals**: confetti, a full-screen moment for each milestone ($1K, $10K MRR…,
  $1M ARR) or your own goal, with the date you'll reach it at your current pace.
- **Made for the wall**: scales from a 720p monitor to a 4K TV and portrait screens, never sleeps,
  recovers from network outages, reloads itself after an update, protects OLED panels.
- **Dead simple settings** with a live preview, and a "send a test celebration" button to check
  the sound on the TV.
- **Several Stripe accounts** on one screen, converted to your currency, or one screen per product.
- **Teams**: workspaces, invitations by link, as many screens as you like.
- **Honest numbers**: MRR follows [Stripe's own definition](docs/stripe.md#how-mrr-is-computed), so
  the TV matches your Stripe Dashboard.
- **Private and secure**: read-only restricted keys encrypted at rest, unguessable screen links,
  customer names hidden unless you allow them.
- **Real time within Stripe's limits**: webhooks for instant updates, and polling that respects
  Stripe's API read allowance when webhooks aren't available.

## Try it

Start the app locally (see [Development](#development)) and open
<http://localhost:3000/d/demo>: a screen fed by a simulated SaaS, where a sale lands every few
seconds. Add `?accent=violet&sound=arcade&range=all&metric=arr` to try other settings.

## Self-hosting

SaaS Monitor is a Next.js app and a PostgreSQL database. With Docker:

```bash
git clone https://github.com/Synapsr/SaaS-Monitor.git
cd SaaS-Monitor
node scripts/setup.mjs      # writes .env with fresh secrets
docker compose up -d        # http://localhost:3000
```

Create your account, connect Stripe with a restricted key, and open your screen's link on any
TV or Raspberry Pi. The [self-hosting guide](docs/self-hosting.md) covers configuration, HTTPS
(needed for instant updates), updates and backups.

<img src="docs/assets/editor.webp" alt="The screen editor: settings on the left, live preview and share panel on the right" />

## How it works

```mermaid
flowchart LR
  Stripe -- "webhook (instant)" --> App
  App -- "Events API (catch-up, within the read budget)" --> Stripe
  App --> DB[(PostgreSQL<br/>subscriptions · MRR ledger · payments)]
  DB --> Screen["/d/token<br/>polls every 10 s"]
```

1. **Import**: subscriptions and 12 months of payments are imported once, in resumable chunks.
2. **Sync**: new activity is read from Stripe's Events API when a webhook announces it, or at a
   pace derived from your read allowance. Every change of MRR is recorded in a ledger, which gives
   the history chart and the new / expansion / contraction / churn breakdown.
3. **Display**: screens poll the app every 10 seconds; syncs run on demand, so no background
   worker is needed and the app runs anywhere Node runs.

More in [Connect Stripe](docs/stripe.md) and [Put it on a TV](docs/wall-display.md).

## Development

Requirements: Node 24, pnpm 10 and Docker.

```bash
pnpm install
node scripts/setup.mjs   # .env with fresh secrets
pnpm db:up               # PostgreSQL + stripe-mock
pnpm dev                 # http://localhost:3000
```

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build   # what CI runs
```

Built with Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Drizzle ORM, PostgreSQL, Better Auth
and the Stripe SDK. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) for the
architecture and conventions.

## License

[MIT](LICENSE)
