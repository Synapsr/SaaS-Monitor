import { sql } from "drizzle-orm";
import { db } from "@/db";
import { members, organizations, users } from "@/db/schema";

/** Empties every table, so each test starts from a blank database. */
export async function resetDatabase() {
  const tables = await db().execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  const names = tables.map(({ tablename }) => `"${tablename}"`).join(", ");
  if (names) await db().execute(sql.raw(`truncate ${names} restart identity cascade`));
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
