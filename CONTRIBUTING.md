# Contributing

Thanks for helping make SaaS Monitor better. Bug reports, ideas and pull requests are welcome.

## Development setup

Requirements: Node 24 (`.nvmrc`), pnpm 10 and Docker.

```bash
pnpm install
node scripts/setup.mjs   # creates .env with fresh secrets
pnpm db:up               # MySQL + stripe-mock in Docker
pnpm dev                 # http://localhost:3000, migrations run on startup
```

Open <http://localhost:3000/d/demo> to see a wall screen with simulated data, no Stripe account
needed. To work with real data, create a Stripe sandbox and connect it with a restricted key
from the dashboard.

## Checks

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

`pnpm test` runs two Vitest projects: `unit` (pure logic, `*.test.ts`) and `db` (integration
tests against MySQL, `*.db.test.ts`, using the `saas_monitor_test` database, which is created and
migrated automatically: the tests connect as root). The tests empty that database between cases:
give each checkout of the repository (another clone, a worktree) its own with `TEST_DATABASE_URL`,
e.g. `mysql://root:saas_monitor@127.0.0.1:3307/saas_monitor_test_2`, so that test runs never
collide. When stripe-mock listens on another port, set `STRIPE_MOCK_PORT` too.

## Guidelines

- Read [`AGENTS.md`](AGENTS.md): it describes the architecture and the rules every change follows
  (tenant isolation, secrets, money in minor units, no work at import time…).
- Keep pull requests focused. Add or update tests with every behavior change.
- Database changes: edit `src/db/schema`, then `pnpm db:generate --name <change>` and commit the
  generated migration (CI fails when the schema and the migrations disagree).
- UI changes: include screenshots of the dashboard and, when relevant, of the wall screen at TV
  resolution.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`…).

## Reporting security issues

Please do not open public issues for vulnerabilities, see [SECURITY.md](SECURITY.md).
