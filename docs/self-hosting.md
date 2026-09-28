# Self-hosting

SaaS Monitor is a single Next.js server and a PostgreSQL database. The provided Docker Compose
file runs both.

## Quick start with Docker

Requirements: Docker with Compose, and Node.js to run the setup script (or see the manual
alternative below).

```bash
git clone https://github.com/Synapsr/SaaS-Monitor.git
cd SaaS-Monitor
node scripts/setup.mjs      # writes .env with fresh secrets
docker compose up -d        # builds the image, starts PostgreSQL and the app
```

Open <http://localhost:3000>, create your account and connect Stripe. Database migrations run
automatically when the app starts.

Without Node.js, create the `.env` by hand: `cp .env.example .env`, then fill `AUTH_SECRET`,
`ENCRYPTION_KEY` and `POSTGRES_PASSWORD` with the output of `openssl rand -hex 32` (a different
value for each).

> Keep `ENCRYPTION_KEY` safe and never change it: it encrypts the Stripe keys stored in the
> database. If it is lost, every Stripe account has to be connected again.

## Configuration

All settings are environment variables, documented in [`.env.example`](../.env.example).

| Variable                                   | Required | Description                                                                                          |
| ------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `APP_URL`                                  | yes      | Public URL of the app, e.g. `https://monitor.example.com`. Used for sign-in, screen links, webhooks. |
| `AUTH_SECRET`                              | yes      | Signs sessions (≥ 32 characters).                                                                    |
| `ENCRYPTION_KEY`                           | yes      | 64 hex characters, encrypts Stripe keys at rest.                                                     |
| `DATABASE_URL`                             | yes      | PostgreSQL URL. Set by `compose.yaml`; needed when you run the app yourself.                         |
| `POSTGRES_PASSWORD`                        | compose  | Password of the bundled database.                                                                    |
| `APP_PORT`                                 | no       | Host port published by `compose.yaml` (default `3000`).                                              |
| `DISABLE_SIGNUPS`                          | no       | `true` to close registrations; invited people can still join.                                        |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | no       | Enables "Continue with GitHub".                                                                      |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no       | Enables "Continue with Google".                                                                      |
| `MIGRATE_ON_START`                         | no       | Apply migrations at startup (default `true`).                                                        |
| `FX_RATES_URL`                             | no       | Exchange-rate API used to combine currencies (default: Frankfurter, ECB rates).                      |

After your team has signed up, set `DISABLE_SIGNUPS=true` and restart: nobody else can create an
account on your instance, while invitations keep working.

## Public URL and HTTPS

The app works on a local network (`http://192.168.1.20:3000`), which is enough for a TV in the
same office. Put it behind HTTPS with a domain to:

- open screens from anywhere,
- get **instant updates**: Stripe can only send webhooks to a public HTTPS URL. Without them,
  SaaS Monitor checks Stripe periodically, at a pace that respects Stripe's API read allowance
  (about every 17 minutes for small accounts, see [Connect Stripe](stripe.md#instant-updates)).

Any reverse proxy works. With [Caddy](https://caddyserver.com), which obtains certificates
automatically:

```caddyfile
monitor.example.com {
	reverse_proxy localhost:3000
}
```

Then set `APP_URL=https://monitor.example.com` in `.env` and run `docker compose up -d` again.

## Updating

```bash
git pull
docker compose up -d --build
```

Open screens notice the new version and reload themselves.

## Backups

Everything lives in PostgreSQL. Stripe data can always be imported again, but accounts, screens
and settings cannot:

```bash
docker compose exec db pg_dump -U saas_monitor saas_monitor > saas-monitor.sql
```

## Running without Docker

Build and start the app with Node.js 24 against any PostgreSQL 15+ database:

```bash
pnpm install --frozen-lockfile
pnpm build
DATABASE_URL=postgres://… AUTH_SECRET=… ENCRYPTION_KEY=… APP_URL=… pnpm start
```

The app also runs on platforms such as Vercel or Railway: syncs are triggered by open screens
and dashboards, so no background worker is needed.
