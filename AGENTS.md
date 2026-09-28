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
pnpm test           # Vitest: unit + db projects (db uses saas_monitor_test)
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build   # what CI runs
```

Node 24 (`.nvmrc`), pnpm 10.

## Architecture

- `src/app` — routes only, kept thin: components live in `src/components`, logic in `src/server`.
  Notable routes:
  - `/app/*`: the authenticated dashboard; `/sign-in`, `/sign-up`, and `/invite/[id]` for
    invitation links.
  - `/d/[token]`: a public wall display, polling `/api/screens/[token]/state`. `/d/demo` is a
    screen fed by a simulation (landing page, trying the product without Stripe).
  - `/api/webhooks/stripe/[accountId]`: Stripe webhooks, which only trigger a sync.
  - `/api/health`: liveness probe for containers (checks the database).
- `src/components/ui` — shadcn/ui primitives (Radix). Feature components live next to them in
  `src/components/<feature>`.
- `src/hooks` — React hooks, whichever feature uses them (the `hooks` alias of
  `components.json`).
- `src/lib` — isomorphic code safe for the browser: contracts (`display/types.ts`,
  `screens/settings.ts`), validation rules shared by forms and actions, formatting (`money.ts`,
  `format.ts` for the dashboard, `display/format.ts` and `display/time.ts` for screens).
- `src/server` — server-only code (`import "server-only"`): auth, tenant guard, Stripe access,
  sync engine, metrics.
- `src/db` — Drizzle schema (`schema/app.ts`, generated `schema/auth.ts`) and client.
- `src/test` — test helpers and fixtures (database, Stripe fakes, display states).

Data flow: Stripe → sync engine (backfill once, then incremental from the Events API) → local
tables (`subscriptions`, `mrr_movements`, `payments`) → metrics → `DisplayState` → display.
Syncs are triggered on demand when a display polls or the dashboard is open (no worker needed).

## Actions and forms

- Server actions live next to the routes that use them, in `src/app/**/actions.ts`. An action
  resolves the workspace (`requireWorkspace()`), parses its input with the service's Zod schema,
  calls the service and revalidates. Services trust their typed input and return an
  `ActionResult` (`src/lib/action-result.ts`); only unexpected failures throw, to the error
  boundary.
- Forms submit with `useActionState`: the action's result is the state, errors render from it
  and `pending` disables the submit button. Buttons that run an action on their own (revoke,
  re-import, send a test) use `useTransition` and report the outcome with a toast.

## Rules

- **Tenant isolation**: every query on tenant data filters on the workspace id returned by
  `requireWorkspace()` (`src/server/session.ts`). Never trust a workspace id from the client.
  Workspaces are Better Auth organizations.
- **Secrets**: Stripe keys are encrypted with `encryptSecret` and never leave the server. The
  public display must not expose anything beyond `DisplayState`.
- **No work at import time**: use `env()`, `db()`, `auth()`; builds must not need secrets.
- **Money** is an integer in the currency's minor unit everywhere (like Stripe). Format with
  `formatMoney`. One deliberate exception: a screen's goal (`settings.goal`) is in major units,
  as founders type it ("10000" for $10k); convert it with `toMinorUnits` before comparing it
  with amounts.
- **Screen settings** are JSON: every new field needs a default in `screenSettingsSchema`.
- Validate all user input with Zod at the boundary (server actions, route handlers).
- Tests sit next to the code. Pure logic gets unit tests (`*.test.ts`); code that needs
  PostgreSQL gets integration tests named `*.db.test.ts`, run serially against the test database
  (`TEST_DATABASE_URL`, created and migrated automatically; see `src/test/db.ts` for helpers).

## Style

- TypeScript strict, Prettier (100 columns, double quotes). Run `pnpm format`.
- Imports use the `@/` alias; a module may import its siblings as `./name`, never a parent folder
  (`../`). Lucide icons are imported by their `…Icon` names. ESLint enforces both.
- Styling is Tailwind classes; animations and tokens are defined in the stylesheets
  (`globals.css`, `wall-palette.css`, `d/display.css`), no CSS modules.
- Small modules with explicit names; comments explain _why_, not _what_.
- UI: clean and calm. English copy, sentence case.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`…). No AI attribution or
  `Co-Authored-By` trailers.
