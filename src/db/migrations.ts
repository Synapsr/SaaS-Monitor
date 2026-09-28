import path from "node:path";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createConnection, type RowDataPacket } from "mysql2/promise";

/** Named lock taken while migrating. Such names are shared by every database of the server. */
const MIGRATION_LOCK = "saas_monitor_migrations";
/** How long an instance waits for another one to finish migrating. */
const LOCK_TIMEOUT_SECONDS = 10 * 60;

/**
 * Applies pending migrations from `./drizzle`. Several app instances may boot at the same time:
 * a named lock makes them take turns, and the later ones find nothing left to apply.
 * Shared by `pnpm db:migrate` and the server startup, hence no `server-only` import.
 */
export async function runMigrations(databaseUrl: string) {
  // The lock belongs to this connection's session.
  const connection = await createConnection(databaseUrl);
  try {
    const [[{ locked }]] = await connection.query<RowDataPacket[]>(
      "select get_lock(?, ?) as locked",
      [MIGRATION_LOCK, LOCK_TIMEOUT_SECONDS],
    );
    if (locked !== 1) {
      throw new Error("Another instance has been migrating the database for too long.");
    }
    await migrate(drizzle({ client: connection }), {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
    await connection.query("select release_lock(?)", [MIGRATION_LOCK]);
  } finally {
    // Ending the session also releases the lock, when migrating failed.
    await connection.end();
  }
}
