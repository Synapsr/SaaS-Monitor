import postgres from "postgres";
import { runMigrations } from "@/db/migrations";
import { testDatabaseUrl } from "./database-url";

/** PostgreSQL error codes: the database does not exist, or was created concurrently. */
const UNKNOWN_DATABASE = "3D000";
const DUPLICATE_DATABASE = "42P04";

function errorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null ? (error as { code?: unknown }).code : null;
}

/** Creates the test database on first use: a fresh clone only has the development one. */
async function ensureDatabase(url: string) {
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await client`select 1`;
    return;
  } catch (error) {
    if (errorCode(error) !== UNKNOWN_DATABASE) throw error;
  } finally {
    await client.end();
  }

  // A database is created from another one of the same server.
  const serverUrl = new URL(url);
  const name = decodeURIComponent(serverUrl.pathname.slice(1));
  serverUrl.pathname = "/postgres";
  const server = postgres(serverUrl.toString(), { max: 1, onnotice: () => {} });
  try {
    await server`create database ${server(name)}`;
  } catch (error) {
    if (errorCode(error) !== DUPLICATE_DATABASE) throw error;
  } finally {
    await server.end();
  }
}

/** Creates the test database if needed and brings its schema up to date, once per run. */
export default async function setup() {
  await ensureDatabase(testDatabaseUrl);
  await runMigrations(testDatabaseUrl);
}
