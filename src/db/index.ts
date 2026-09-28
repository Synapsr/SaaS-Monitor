import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

function createDatabase() {
  const client = postgres(env().DATABASE_URL, { max: 10, onnotice: () => {} });
  return drizzle({ client, schema, casing: "snake_case" });
}

export type Database = ReturnType<typeof createDatabase>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

// One pool per process, reused across hot reloads in development. Created on first use so that
// builds never need a database.
const globalForDb = globalThis as typeof globalThis & { saasMonitorDb?: Database };

export function db(): Database {
  return (globalForDb.saasMonitorDb ??= createDatabase());
}
