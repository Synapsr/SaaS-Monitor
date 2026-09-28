<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SaaS Monitor

Open-source, multi-tenant Stripe dashboard for SaaS founders. Users connect Stripe accounts with a
restricted API key, then open a public "screen" URL (`/d/<token>`) on a TV or Raspberry Pi that
shows MRR, revenue and a live feed, with sounds and celebrations.

## Commands

```bash
pnpm db:up          # Postgres 18 + stripe-mock in Docker (compose.dev.yaml)
pnpm db:migrate     # apply migrations in ./drizzle
pnpm db:generate    # create a migration after editing src/db/schema
pnpm dev            # http://localhost:3000 (use -p to pick another port)
pnpm test           # Vitest; DB tests use the `saas_monitor_test` database
pnpm lint && pnpm typecheck && pnpm format:check
```

Node 24 (`.nvmrc`), pnpm 10.

## Architecture

- `src/app` — routes only, kept thin. `/app/*` is the authenticated dashboard, `/d/[token]` the
  public wall display, `/api/screens/[token]/state` the display polling endpoint.
- `src/components/ui` — shadcn/ui primitives (Radix). Feature components live next to them in
  `src/components/<feature>`.
- `src/lib` — isomorphic code safe for the browser: contracts (`display/types.ts`,
  `screens/settings.ts`), money formatting, utilities.
- `src/server` — server-only code (`import "server-only"`): auth, tenant guard, Stripe access,
  sync engine, metrics.
- `src/db` — Drizzle schema (`schema/app.ts`, generated `schema/auth.ts`) and client.

Data flow: Stripe → sync engine (backfill once, then incremental from the Events API) → local
tables (`subscriptions`, `mrr_movements`, `payments`) → metrics → `DisplayState` → display.
Syncs are triggered on demand when a display polls or the dashboard is open (no worker needed).

## Rules

- **Tenant isolation**: every query on tenant data filters on the workspace id returned by
  `requireWorkspace()` (`src/server/session.ts`). Never trust a workspace id from the client.
  Workspaces are Better Auth organizations.
- **Secrets**: Stripe keys are encrypted with `encryptSecret` and never leave the server. The
  public display must not expose anything beyond `DisplayState`.
- **No work at import time**: use `env()`, `db()`, `auth()`; builds must not need secrets.
- **Money** is an integer in the currency's minor unit everywhere (like Stripe). Format with
  `formatMoney`.
- **Screen settings** are JSON: every new field needs a default in `screenSettingsSchema`.
- Validate all user input with Zod at the boundary (server actions, route handlers).
- Tests sit next to the code (`*.test.ts`). Pure logic gets unit tests; DB code gets
  integration tests against the test database.

## Style

- TypeScript strict, Prettier (100 columns, double quotes). Run `pnpm format`.
- Small modules with explicit names; comments explain _why_, not _what_.
- UI: clean and calm. English copy, sentence case.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`…). No AI attribution or
  `Co-Authored-By` trailers.
