/** Runs once when a server instance starts, before it accepts requests. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { env } = await import("@/env");
  // Fail fast on a bad configuration instead of on the first request.
  const config = env();

  if (config.MIGRATE_ON_START) {
    const { runMigrations } = await import("@/db/migrations");
    await runMigrations(config.DATABASE_URL);
  }
}
