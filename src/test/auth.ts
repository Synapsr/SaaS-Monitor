import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, organizations, users } from "@/db/schema";
import { parseRole } from "@/lib/roles";
import { auth } from "@/server/auth";
import type { WorkspaceContext } from "@/server/session";
import { ensureWorkspace } from "@/server/workspaces";

/**
 * Signs a user up through Better Auth and returns the request headers of their session, to call
 * endpoints that need one (organization API) exactly as a server action would.
 */
export async function signUp(name: string, email = `${name.toLowerCase()}@example.com`) {
  const { headers } = await auth().api.signUpEmail({
    body: { name, email, password: "correct horse battery staple" },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(";")[0])
    .join("; ");
  const requestHeaders = new Headers({ cookie });
  const session = await auth().api.getSession({ headers: requestHeaders });
  if (!session) throw new Error(`Could not sign ${email} up.`);
  return {
    userId: session.user.id,
    requestHeaders,
    personalWorkspaceId: await ensureWorkspace(session.user.id),
  };
}

/** What `requireWorkspace()` returns for this user in this workspace. */
export async function workspaceContext(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceContext> {
  const [row] = await db()
    .select({
      name: users.name,
      email: users.email,
      role: members.role,
      workspaceName: organizations.name,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .innerJoin(organizations, eq(organizations.id, members.organizationId))
    .where(and(eq(members.userId, userId), eq(members.organizationId, workspaceId)));
  if (!row) throw new Error("Not a member of this workspace.");
  return {
    user: { id: userId, name: row.name, email: row.email, image: null },
    workspace: { id: workspaceId, name: row.workspaceName },
    role: parseRole(row.role),
  };
}
