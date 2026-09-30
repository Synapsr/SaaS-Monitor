# Self-hosting

SaaS Monitor is a single Next.js server and a MySQL database. The Docker Compose file runs both,
with the image published for each release.

## Quick start with Docker

Requirements: [Docker](https://docs.docker.com/get-started/get-docker/) with Compose, on a
server, a spare computer or a Raspberry Pi with a 64-bit OS: the image is built for amd64 and
arm64.

```bash
curl -fsSL https://saas-monitor.com/install.sh | sh
cd saas-monitor && docker compose up -d
```

The [script](../public/install.sh) creates a `saas-monitor` folder holding `compose.yaml` and a
`.env` with fresh secrets, then stops: it needs no root, starts nothing and touches nothing else.
It is short, so read it first if you like (`curl -fsSL https://saas-monitor.com/install.sh`), or
follow [the same steps by hand](#the-same-by-hand). Then open <http://localhost:3000>, create your
account and connect Stripe. Database migrations run automatically when the app starts.

**Opening it from a TV or another computer?** Set `APP_URL` in `.env` to the address they will
use, such as `http://192.168.1.20:3000` or `https://monitor.example.com`, and run
`docker compose up -d` again: screen links, invitation links and sign-in callbacks are built from
it. The script can also write it for you:

```bash
curl -fsSL https://saas-monitor.com/install.sh | APP_URL=http://192.168.1.20:3000 sh
```

> Keep `ENCRYPTION_KEY` safe and never change it: it encrypts the Stripe keys stored in the
> database. If it is lost, every Stripe account has to be connected again.

### The same, by hand

The script only downloads two files from this repository and fills in the secrets:

```bash
mkdir saas-monitor && cd saas-monitor
curl -fsSLO https://raw.githubusercontent.com/Synapsr/SaaS-Monitor/main/compose.yaml
curl -fsSL https://raw.githubusercontent.com/Synapsr/SaaS-Monitor/main/.env.example -o .env
for key in AUTH_SECRET ENCRYPTION_KEY MYSQL_PASSWORD MYSQL_ROOT_PASSWORD; do
  sed -i.bak "s/^$key=\$/$key=$(openssl rand -hex 32)/" .env
done
rm .env.bak && chmod 600 .env
docker compose up -d
```

Each secret gets its own value from `openssl rand -hex 32`. In a clone of the repository,
`node scripts/setup.mjs` writes the `.env` the same way.

## The published image

`compose.yaml` runs `ghcr.io/synapsr/saas-monitor`, which each release publishes for amd64 and
arm64. `SAAS_MONITOR_VERSION` in `.env` picks the version: `latest` by default, or a release such
as `1.1.0` (or `1.1`, its latest patch) to update on your own terms.

It behaves like a build of your own, with one difference. Static pages, such as the landing page
at `/`, are rendered when the image is built, and so is the absolute address of their social
preview image: in the published image, it points to `http://localhost:3000`. Shared in a chat,
your instance's home page then shows no preview image. Screens, the dashboard and the sign-in
pages read your `APP_URL` when they are served, as usual. If that preview matters to you,
[build from source](#build-from-source).

Open screens reload themselves when the version changes: published images are identified by
their release.

## Build from source

In a clone of the repository, `compose.build.yaml` builds the image from your source instead of
pulling it:

```bash
git clone https://github.com/Synapsr/SaaS-Monitor.git
cd SaaS-Monitor
node scripts/setup.mjs                                     # writes .env with fresh secrets
echo "COMPOSE_FILE=compose.yaml:compose.build.yaml" >> .env
docker compose up -d                                       # builds the image, then starts it
```

With `COMPOSE_FILE` set, `docker compose up -d` builds the image (from cache when nothing changed)
under the name `saas-monitor:local`, so that it never passes for a published release. It passes
two values to the build:

- `APP_URL`, for the social previews of static pages, written into them when the app is built.
- `BUILD_ID` (optional), which identifies the build: open screens reload themselves when it
  changes. Leave it empty to get a new one with every build.

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
| `SAAS_MONITOR_VERSION`                     | no       | Version of the [published image](#the-published-image) (default `latest`), e.g. `1.1.0`.             |
| `DISABLE_SIGNUPS`                          | no       | `true` to close registrations; invited people can still join.                                        |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | no       | Enables "Continue with GitHub".                                                                      |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no       | Enables "Continue with Google".                                                                      |
| `MIGRATE_ON_START`                         | no       | Apply migrations at startup (default `true`).                                                        |
| `FX_RATES_URL`                             | no       | Exchange-rate API used to combine currencies (default: Frankfurter, ECB rates).                      |
| `GRADIUM_API_KEY`                          | no       | Lets screens say [their own phrases](wall-display.md#voice), synthesized by Gradium.                 |
| `GRADIUM_API_URL`                          | no       | Gradium's API (default `https://api.gradium.ai/api`; `eu.` or `us.` hosts keep data in a region).    |

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

and run `docker compose up -d` again.

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
docker compose pull
docker compose up -d
```

Open screens notice the new version and reload themselves. With a pinned `SAAS_MONITOR_VERSION`,
change it first. When you [build from source](#build-from-source), update with
`git pull && docker compose up -d`.

Installed from a clone with an earlier `compose.yaml`, which built the image? After `git pull`,
`docker compose up -d` runs the published image of the latest release instead, with the same
database. If your clone ran changes from `main` that are not released yet, or to keep building
your own, add the `COMPOSE_FILE` line of [Build from source](#build-from-source) to `.env` first.

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

## Analytics (optional, off by default)

A self-hosted instance loads no analytics script and sends no event anywhere. Its pages only ask
the app itself (`/api/pa`) whether analytics are on.

To measure visits with [Plausible](https://plausible.io), for example on a public instance with
its landing page, set in `.env` and restart the app (no rebuild needed):

```bash
# The site's domain as registered in Plausible.
PLAUSIBLE_DOMAIN=monitor.example.com
# Optional: your own Plausible Community Edition (default https://plausible.io).
PLAUSIBLE_HOST=https://plausible.example.com
```

- **First party, no cookies.** Browsers only talk to your instance: it serves Plausible's script
  at `/js/pa.js` and relays events from `/api/pa`, so the Content-Security-Policy stays `'self'`.
  Plausible tells visitors apart without cookies, from their address and browser, which the relay
  passes on: behind a reverse proxy, make sure it sets `X-Forwarded-For` (see above), or
  Plausible drops the events as coming from a server.
- **No ids, no tokens.** URLs are redacted in the browser, then again by the server: ids in
  dashboard and invitation links become `:id`, and query strings keep only `ref`, `source` and
  `utm_*` parameters. Screens (`/d/<token>`) and pages shown in a frame are never counted; the
  demo (`/d/demo`) is.
- **Goals.** Besides pageviews, the app sends these custom events, to add as goals in Plausible:
  `Demo opened`, `Demo sound on`, `Signup` (with the properties `method` and `invited`),
  `Stripe connected`, `Test celebration` and `Hear it`.

Plausible's script ignores `localhost`: check it on the real domain.
