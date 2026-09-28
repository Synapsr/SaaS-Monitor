import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, organizations, users } from "@/db/schema";

async function createPersonalWorkspace(userId: string): Promise<string> {
  const [user] = await db().select({ name: users.name }).from(users).where(eq(users.id, userId));
  const firstName = user?.name.trim().split(/\s+/)[0];
  const workspaceId = crypto.randomUUID();
  const now = new Date();

  await db().transaction(async (tx) => {
    await tx.insert(organizations).values({
      id: workspaceId,
      name: firstName ? `${firstName}'s workspace` : "My workspace",
      slug: workspaceId,
      createdAt: now,
    });
    await tx.insert(members).values({
      id: crypto.randomUUID(),
      organizationId: workspaceId,
      userId,
      role: "owner",
      createdAt: now,
    });
  });

  return workspaceId;
}

/**
 * Returns the workspace a user lands in (the first one they joined), creating a personal
 * workspace when they have none: new accounts are usable right away.
 */
export async function ensureWorkspace(userId: string): Promise<string> {
  const [membership] = await db()
    .select({ workspaceId: members.organizationId })
    .from(members)
    .where(eq(members.userId, userId))
    .orderBy(asc(members.createdAt))
    .limit(1);
  return membership?.workspaceId ?? createPersonalWorkspace(userId);
}
