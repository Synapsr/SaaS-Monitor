import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import { env } from "@/env";
import * as schema from "./schema";

/**
 * Settings of every connection:
 * - UTC, the time zone of every stored instant (see `instant` in ./schema/columns.ts). Drizzle
 *   reads and writes date columns as UTC by itself; `now()` must agree.
 * - READ COMMITTED, which the sync engine's locking is designed for. InnoDB's default, REPEATABLE
 *   READ, also locks the gaps where the rows a sync looks for are missing: imports of different
 *   accounts running side by side then deadlock.
 */
const SESSION_SETTINGS = "set time_zone = '+00:00', transaction_isolation = 'READ-COMMITTED'";

function createDatabase() {
  const pool = createPool({
    uri: env().DATABASE_URL,
    connectionLimit: 10,
    // Dates passed to raw SQL are written in UTC too.
    timezone: "Z",
    // An update's `affectedRows` counts the rows it matched, changed or not: services tell a
    // missing row from an unchanged one with it. mysql2's default, stated as it is relied on.
    flags: ["FOUND_ROWS"],
    enableKeepAlive: true,
  });
  pool.on("connection", (connection) => {
    // Queued before the connection runs anything else.
    connection.query(SESSION_SETTINGS, (error) => {
      if (error) console.error("[db] Could not set up a new connection:", error.message);
    });
  });
  return drizzle({ client: pool, schema, casing: "snake_case", mode: "default" });
}

export type Database = ReturnType<typeof createDatabase>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

// One pool per process, reused across hot reloads in development. Created on first use so that
// builds never need a database.
const globalForDb = globalThis as typeof globalThis & { saasMonitorDb?: Database };

export function db(): Database {
  return (globalForDb.saasMonitorDb ??= createDatabase());
}
