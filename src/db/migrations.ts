import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Arbitrary but stable key for pg_advisory_lock.
const MIGRATION_LOCK_KEY = 4_172_026_928;

/**
 * Applies pending migrations from `./drizzle`. Several app instances may boot at the same time:
 * an advisory lock makes them take turns, and the later ones find nothing left to apply.
 * Shared by `pnpm db:migrate` and the server startup, hence no `server-only` import.
 */
export async function runMigrations(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await client`select pg_advisory_lock(${MIGRATION_LOCK_KEY})`;
    await migrate(drizzle({ client }), {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
  } finally {
    // Ending the only session also releases the advisory lock.
    await client.end();
  }
}
