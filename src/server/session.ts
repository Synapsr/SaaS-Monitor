import "server-only";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { members, organizations } from "@/db/schema";
import { auth } from "@/server/auth";
import { ensureWorkspace, type WorkspaceRole } from "@/server/workspaces";

export const getSession = cache(async () => {
  // Read the request first: during `next build` this marks the page as dynamic before `auth()`
  // would need runtime configuration that builds don't have.
  const requestHeaders = await headers();
  return auth().api.getSession({ headers: requestHeaders });
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export interface WorkspaceContext {
  user: { id: string; name: string; email: string; image: string | null };
  workspace: { id: string; name: string };
  role: WorkspaceRole;
}

type Membership = { id: string; name: string; role: string };

async function findMembership(userId: string, workspaceId: string): Promise<Membership | null> {
  const [row] = await db()
    .select({ id: organizations.id, name: organizations.name, role: members.role })
    .from(members)
    .innerJoin(organizations, eq(organizations.id, members.organizationId))
    .where(and(eq(members.userId, userId), eq(members.organizationId, workspaceId)))
    .limit(1);
  return row ?? null;
}

function toRole(role: string): WorkspaceRole {
  // Better Auth stores multiple roles comma-separated; the highest one wins.
  const roles = role.split(",").map((value) => value.trim());
  if (roles.includes("owner")) return "owner";
  if (roles.includes("admin")) return "admin";
  return "member";
}

/**
 * Resolves the workspace of the current request and verifies membership. Every tenant-scoped
 * query must filter on the `workspace.id` returned here, never on an id sent by the client.
 */
export const requireWorkspace = cache(async (): Promise<WorkspaceContext> => {
  const { user, session } = await requireSession();

  // The active workspace can be stale (e.g. the user was removed from it): fall back to the
  // workspace they land in by default.
  const membership =
    (session.activeOrganizationId &&
      (await findMembership(user.id, session.activeOrganizationId))) ||
    (await findMembership(user.id, await ensureWorkspace(user.id)));
  if (!membership) throw new Error("Could not resolve a workspace for the current user.");

  return {
    user: { id: user.id, name: user.name, email: user.email, image: user.image ?? null },
    workspace: { id: membership.id, name: membership.name },
    role: toRole(membership.role),
  };
});
