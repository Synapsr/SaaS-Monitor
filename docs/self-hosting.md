# Self-hosting

SaaS Monitor is a single Next.js server and a MySQL database. The provided Docker Compose file
runs both.

## Quick start with Docker

Requirements: Docker with Compose, and Node.js to run the setup script (or see the manual
alternative below).

```bash
git clone https://github.com/Synapsr/SaaS-Monitor.git
cd SaaS-Monitor
node scripts/setup.mjs      # writes .env with fresh secrets
docker compose up -d        # builds the image, starts MySQL and the app
```

Open <http://localhost:3000>, create your account and connect Stripe. Database migrations run
automatically when the app starts.

Without Node.js, create the `.env` by hand: `cp .env.example .env`, then fill `AUTH_SECRET`,
`ENCRYPTION_KEY`, `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` with the output of
`openssl rand -hex 32` (a different value for each).

> Keep `ENCRYPTION_KEY` safe and never change it: it encrypts the Stripe keys stored in the
> database. If it is lost, every Stripe account has to be connected again.

## Configuration

All settings are environment variables, documented in [`.env.example`](../.env.example).

| Variable                                   | Required | Description                                                                                          |
| ------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `APP_URL`                                  | yes      | Public URL of the app, e.g. `https://monitor.example.com`. Used for sign-in, screen links, webhooks. |
| `AUTH_SECRET`                              | yes      | Signs sessions (≥ 32 characters).                                                                    |
| `ENCRYPTION_KEY`                           | yes      | 64 hex characters, encrypts Stripe keys at rest.                                                     |
| `DATABASE_URL`                             | yes      | MySQL URL (`mysql://…`). Set by `compose.yaml`; needed when you run the app yourself.                |
| `MYSQL_PASSWORD`                           | compose  | Password of the bundled database's user.                                                             |
| `MYSQL_ROOT_PASSWORD`                      | compose  | Password of its root user, for administration and backups.                                           |
| `APP_PORT`                                 | no       | Host port published by `compose.yaml` (default `3000`).                                              |
| `DISABLE_SIGNUPS`                          | no       | `true` to close registrations; invited people can still join.                                        |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | no       | Enables "Continue with GitHub".                                                                      |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no       | Enables "Continue with Google".                                                                      |
| `MIGRATE_ON_START`                         | no       | Apply migrations at startup (default `true`).                                                        |
| `FX_RATES_URL`                             | no       | Exchange-rate API used to combine currencies (default: Frankfurter, ECB rates).                      |
| `GRADIUM_API_KEY`                          | no       | Lets screens say [their own phrases](wall-display.md#voice), synthesized by Gradium.                 |
| `GRADIUM_API_URL`                          | no       | Gradium's API (default `https://api.gradium.ai/api`; `eu.` or `us.` hosts keep data in a region).    |

After your team has signed up, set `DISABLE_SIGNUPS=true` and restart: nobody else can create an
account on your instance, while invitations keep working.

`compose.yaml` also passes two values to the image build:

- `APP_URL`, because the absolute links of social previews (a screen shared in a chat, the landing
  page) are written into the pages when the app is built. Rebuild after changing it:
  `docker compose up -d --build`.
- `BUILD_ID` (optional), which identifies the build: open screens reload themselves when it
  changes. Leave it empty to get a new one with every build; the published images use their
  version number.

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
	header Strict-Transport-Security "max-age=31536000"
	reverse_proxy localhost:3000
}
```

Then, in `.env`:

```bash
APP_URL=https://monitor.example.com
# Only the proxy reaches the app: see below.
APP_PORT=127.0.0.1:3000
```

and run `docker compose up -d --build` (the image is rebuilt for `APP_URL`, see above).

Behind a proxy, keep these in mind:

- **Publish the app on localhost only** (`APP_PORT=127.0.0.1:3000`). Sign-in attempts are rate
  limited by client address, which the app reads from `X-Forwarded-For`: anyone reaching port
  3000 directly could forge that header and get around the limit. TVs then open screens through
  the proxy's HTTPS address.
- **Use a proxy that sets `X-Forwarded-For` itself** rather than passing on what clients send.
  Caddy does by default.
- **Enable HSTS at the proxy**, as above, so that browsers never use plain HTTP again.

## Updating

```bash
git pull
docker compose up -d --build
```

Open screens notice the new version and reload themselves.

## Backups

Everything lives in MySQL. Stripe data can always be imported again, but accounts, screens and
settings cannot:

```bash
docker compose exec -T db sh -c 'exec mysqldump --single-transaction -u root -p"$MYSQL_ROOT_PASSWORD" saas_monitor' > saas-monitor.sql
```

To restore a backup into the database:

```bash
docker compose exec -T db sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" saas_monitor' < saas-monitor.sql
```

## Running without Docker

Build and start the app with Node.js 24 (22.13 at least, as `engines` in `package.json` says)
against a MySQL 8.4 database (8.0.14 or later works too):

```bash
pnpm install --frozen-lockfile
pnpm build
DATABASE_URL=mysql://… AUTH_SECRET=… ENCRYPTION_KEY=… APP_URL=… pnpm start
```

The database needs its time zone tables, which screens use to count days in their own time zone.
The official Docker image loads them; elsewhere, load them on the database server with
`mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql -u root -p mysql` (the app refuses to start
without them). Keep MySQL's defaults for the character set (utf8mb4) and for binary logging
(row-based, which the app's READ COMMITTED transactions need), and give the app's user all
privileges on its database: it applies the migrations when it starts.

The app also runs on platforms such as Vercel or Railway: syncs are triggered by open screens
and dashboards, so no background worker is needed.
