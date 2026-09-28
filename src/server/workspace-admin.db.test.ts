import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { auth } from "@/server/auth";
import { signUp, workspaceContext } from "@/test/auth";
import { resetDatabase } from "@/test/db";
import { acceptInvitation, inviteMember } from "./members";
import {
  createWorkspace,
  deleteWorkspace,
  listUserWorkspaces,
  renameWorkspace,
  switchWorkspace,
} from "./workspace-admin";

async function activeWorkspaceId(requestHeaders: Headers) {
  const session = await auth().api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  });
  return session?.session.activeOrganizationId;
}

// Password hashing is deliberately slow: leave time for a few sign-ups per test.
describe("workspace administration", { timeout: 30_000 }, () => {
  beforeEach(resetDatabase);

  it("creates workspaces and switches between them", async () => {
    const ada = await signUp("Ada");

    const created = await createWorkspace(ada.requestHeaders, "  Side project ");
    if (!created.ok) throw new Error(created.error);

    expect(await listUserWorkspaces(ada.userId)).toEqual([
      { id: ada.personalWorkspaceId, name: "Ada's workspace", role: "owner" },
      { id: created.workspaceId, name: "Side project", role: "owner" },
    ]);
    expect(await activeWorkspaceId(ada.requestHeaders)).toBe(created.workspaceId);
    expect(await switchWorkspace(ada.requestHeaders, ada.personalWorkspaceId)).toEqual({
      ok: true,
    });
    expect(await activeWorkspaceId(ada.requestHeaders)).toBe(ada.personalWorkspaceId);
  });

  it("refuses to switch to someone else's workspace", async () => {
    const ada = await signUp("Ada");
    const eve = await signUp("Eve");

    expect((await switchWorkspace(eve.requestHeaders, ada.personalWorkspaceId)).ok).toBe(false);
  });

  it("lets owners and admins rename the workspace, and only owners delete it", async () => {
    const ada = await signUp("Ada");
    const owner = await workspaceContext(ada.userId, ada.personalWorkspaceId);
    const grace = await signUp("Grace");
    const invitation = await inviteMember(owner, ada.requestHeaders, {
      email: "grace@example.com",
      role: "admin",
    });
    if (!invitation.ok) throw new Error(invitation.error);
    await acceptInvitation(grace.requestHeaders, invitation.invitationId);
    const admin = await workspaceContext(grace.userId, ada.personalWorkspaceId);

    expect(await renameWorkspace(admin, grace.requestHeaders, "Acme HQ")).toEqual({ ok: true });
    expect(await renameWorkspace(owner, ada.requestHeaders, " ")).toEqual({
      ok: false,
      error: "Give the workspace a name.",
    });
    expect(await deleteWorkspace(admin, grace.requestHeaders)).toEqual({
      ok: false,
      error: "Only owners can delete the workspace.",
    });

    expect(await deleteWorkspace(owner, ada.requestHeaders)).toEqual({ ok: true });
    expect(
      await db().select().from(organizations).where(eq(organizations.id, ada.personalWorkspaceId)),
    ).toEqual([]);
    // Ada lost her only workspace: she lands in a fresh one.
    const [fresh] = await listUserWorkspaces(ada.userId);
    expect(fresh).toMatchObject({ name: "Ada's workspace", role: "owner" });
    expect(await activeWorkspaceId(ada.requestHeaders)).toBe(fresh.id);
    expect(await listUserWorkspaces(grace.userId)).toEqual([
      { id: grace.personalWorkspaceId, name: "Grace's workspace", role: "owner" },
    ]);
  });
});
