import { createConnection, escapeId } from "mysql2/promise";
import { runMigrations } from "@/db/migrations";
import { testDatabaseUrl } from "./database-url";

/** Creates the test database on first use: a fresh clone only has the development one. */
async function ensureDatabase(url: string) {
  // Connected to the server alone, since the database may not exist yet.
  const serverUrl = new URL(url);
  const name = decodeURIComponent(serverUrl.pathname.slice(1));
  serverUrl.pathname = "/";
  const server = await createConnection(serverUrl.toString());
  try {
    await server.query(`create database if not exists ${escapeId(name)}`);
  } finally {
    await server.end();
  }
}

/** Creates the test database if needed and brings its schema up to date, once per run. */
export default async function setup() {
  await ensureDatabase(testDatabaseUrl);
  await runMigrations(testDatabaseUrl);
}
