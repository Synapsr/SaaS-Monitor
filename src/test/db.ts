import { sql } from "drizzle-orm";
import { db } from "@/db";
import { members, organizations, users } from "@/db/schema";

/** Empties every table, so each test starts from a blank database. */
export async function resetDatabase() {
  const tables = await db()
    .select({ name: sql<string>`table_name` })
    .from(sql`information_schema.tables`)
    // Drizzle's record of the applied migrations stays.
    .where(sql`table_schema = database() and table_name <> '__drizzle_migrations'`);
  for (const { name } of tables) {
    // In any order: foreign keys are not checked.
    await db().execute(
      sql`delete /*+ SET_VAR(foreign_key_checks = OFF) */ from ${sql.identifier(name)}`,
    );
  }
}

/** Creates a user who owns a workspace, the starting point of most tenant-scoped tests. */
export async function createUserWithWorkspace(name = "Ada Lovelace") {
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const now = new Date();
  await db()
    .insert(users)
    .values({ id: userId, name, email: `${userId}@example.com`, createdAt: now, updatedAt: now });
  await db()
    .insert(organizations)
    .values({ id: workspaceId, name: `${name}’s workspace`, slug: workspaceId, createdAt: now });
  await db().insert(members).values({
    id: crypto.randomUUID(),
    organizationId: workspaceId,
    userId,
    role: "owner",
    createdAt: now,
  });
  return { userId, workspaceId };
}
