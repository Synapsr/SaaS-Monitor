import { beforeEach, describe, expect, it } from "vitest";
import { auth } from "@/server/auth";
import { signUp, workspaceContext } from "@/test/auth";
import { resetDatabase } from "@/test/db";
import {
  acceptInvitation,
  getInvitationPreview,
  inviteMember,
  inviteSchema,
  leaveWorkspace,
  listMembers,
  listPendingInvitations,
  removeMember,
  revokeInvitation,
} from "./members";
import type { WorkspaceContext } from "./session";

type Role = "owner" | "admin" | "member";

/** Ada owns a workspace; `role` decides how the invited person joins it. */
async function workspaceWithMember(role: Role, name = "Bob") {
  const ada = await signUp("Ada");
  const owner = await workspaceContext(ada.userId, ada.personalWorkspaceId);
  const person = await signUp(name);
  const invitation = await inviteMember(owner, ada.requestHeaders, {
    email: `${name.toLowerCase()}@example.com`,
    role,
  });
  if (!invitation.ok) throw new Error(invitation.error);
  const accepted = await acceptInvitation(person.requestHeaders, invitation.invitationId);
  if (!accepted.ok) throw new Error(accepted.error);
  return {
    ada,
    owner,
    person,
    context: await workspaceContext(person.userId, ada.personalWorkspaceId),
  };
}

async function memberId(context: WorkspaceContext, headers: Headers, userId: string) {
  const member = (await listMembers(context, headers)).find((row) => row.userId === userId);
  if (!member) throw new Error("Member not found.");
  return member.id;
}

// Password hashing is deliberately slow: leave time for a few sign-ups per test.
describe("members", { timeout: 30_000 }, () => {
  beforeEach(resetDatabase);

  it("invites people with a link that shows who invited them", async () => {
    const ada = await signUp("Ada Lovelace", "ada@example.com");
    const owner = await workspaceContext(ada.userId, ada.personalWorkspaceId);
    const input = inviteSchema.parse({ email: "  Bob@Example.com ", role: "member" });

    const invitation = await inviteMember(owner, ada.requestHeaders, input);
    if (!invitation.ok) throw new Error(invitation.error);

    expect(await listPendingInvitations(owner, ada.requestHeaders)).toMatchObject([
      { id: invitation.invitationId, email: "bob@example.com", role: "member" },
    ]);
    expect(await getInvitationPreview(invitation.invitationId)).toMatchObject({
      email: "bob@example.com",
      workspaceName: "Ada's workspace",
      inviterName: "Ada Lovelace",
      status: "pending",
    });
    // Inviting again gives the same link back instead of an error.
    expect(await inviteMember(owner, ada.requestHeaders, input)).toEqual(invitation);
  });

  it("only shows owner invitations to owners", async () => {
    const { ada, owner, person, context: admin } = await workspaceWithMember("admin");
    for (const [email, role] of [
      ["carol@example.com", "member"],
      ["dave@example.com", "owner"],
    ] as const) {
      const invitation = await inviteMember(owner, ada.requestHeaders, { email, role });
      if (!invitation.ok) throw new Error(invitation.error);
    }

    expect(
      (await listPendingInvitations(owner, ada.requestHeaders)).map(({ email }) => email),
    ).toEqual(expect.arrayContaining(["carol@example.com", "dave@example.com"]));
    expect(
      (await listPendingInvitations(admin, person.requestHeaders)).map(({ email }) => email),
    ).toEqual(["carol@example.com"]);
  });

  it("only lets the invited email address join", async () => {
    const ada = await signUp("Ada");
    const owner = await workspaceContext(ada.userId, ada.personalWorkspaceId);
    const invitation = await inviteMember(owner, ada.requestHeaders, {
      email: "bob@example.com",
      role: "member",
    });
    if (!invitation.ok) throw new Error(invitation.error);
    const eve = await signUp("Eve");
    const bob = await signUp("Bob");

    expect(await acceptInvitation(eve.requestHeaders, invitation.invitationId)).toEqual({
      ok: false,
      error: "This invitation was sent to another email address.",
    });
    expect(await acceptInvitation(bob.requestHeaders, invitation.invitationId)).toEqual({
      ok: true,
      workspaceId: ada.personalWorkspaceId,
    });

    const session = await auth().api.getSession({
      headers: bob.requestHeaders,
      query: { disableCookieCache: true },
    });
    expect(session?.session.activeOrganizationId).toBe(ada.personalWorkspaceId);
    expect((await listMembers(owner, ada.requestHeaders)).map(({ role }) => role)).toEqual([
      "owner",
      "member",
    ]);
    expect((await getInvitationPreview(invitation.invitationId))?.status).toBe("accepted");
  });

  it("keeps members from managing people", async () => {
    const { ada, owner, person, context } = await workspaceWithMember("member");
    const adaMemberId = await memberId(owner, ada.requestHeaders, ada.userId);
    const pending = await inviteMember(owner, ada.requestHeaders, {
      email: "carol@example.com",
      role: "member",
    });
    if (!pending.ok) throw new Error(pending.error);
    const refused = { ok: false, error: "Only owners and admins can manage members." };

    expect(
      await inviteMember(context, person.requestHeaders, {
        email: "mallory@example.com",
        role: "member",
      }),
    ).toEqual(refused);
    expect(await removeMember(context, person.requestHeaders, adaMemberId)).toEqual(refused);
    expect(await revokeInvitation(context, person.requestHeaders, pending.invitationId)).toEqual(
      refused,
    );
    expect(await listPendingInvitations(owner, ada.requestHeaders)).toHaveLength(1);
  });

  it("lets admins manage members, but not owners", async () => {
    const { ada, owner, person: admin, context } = await workspaceWithMember("admin", "Grace");
    const adaMemberId = await memberId(owner, ada.requestHeaders, ada.userId);

    expect(
      await inviteMember(context, admin.requestHeaders, {
        email: "zoe@example.com",
        role: "owner",
      }),
    ).toEqual({ ok: false, error: "Only owners can invite other owners." });
    expect(await removeMember(context, admin.requestHeaders, adaMemberId)).toEqual({
      ok: false,
      error: "Only owners can remove another owner.",
    });

    const bob = await signUp("Bob");
    const invitation = await inviteMember(context, admin.requestHeaders, {
      email: "bob@example.com",
      role: "member",
    });
    if (!invitation.ok) throw new Error(invitation.error);
    await acceptInvitation(bob.requestHeaders, invitation.invitationId);
    const bobMemberId = await memberId(owner, ada.requestHeaders, bob.userId);

    expect(await removeMember(context, admin.requestHeaders, bobMemberId)).toEqual({ ok: true });
    expect((await listMembers(owner, ada.requestHeaders)).map(({ name }) => name)).toEqual([
      "Ada",
      "Grace",
    ]);
  });

  it("revokes invitations of the current workspace only", async () => {
    const ada = await signUp("Ada");
    const owner = await workspaceContext(ada.userId, ada.personalWorkspaceId);
    const eve = await signUp("Eve");
    const eveOwner = await workspaceContext(eve.userId, eve.personalWorkspaceId);
    const invitation = await inviteMember(owner, ada.requestHeaders, {
      email: "bob@example.com",
      role: "member",
    });
    if (!invitation.ok) throw new Error(invitation.error);

    expect((await revokeInvitation(eveOwner, eve.requestHeaders, invitation.invitationId)).ok).toBe(
      false,
    );
    expect(await revokeInvitation(owner, ada.requestHeaders, invitation.invitationId)).toEqual({
      ok: true,
    });
    expect(await listPendingInvitations(owner, ada.requestHeaders)).toEqual([]);
    expect((await getInvitationPreview(invitation.invitationId))?.status).toBe("revoked");
  });

  it("never leaves a workspace without an owner", async () => {
    const { ada, owner, person, context } = await workspaceWithMember("member");

    expect((await leaveWorkspace(owner, ada.requestHeaders)).ok).toBe(false);
    expect(await leaveWorkspace(context, person.requestHeaders)).toEqual({ ok: true });
    expect(await listMembers(owner, ada.requestHeaders)).toHaveLength(1);
  });

  it("reports expired and unknown invitations", async () => {
    const ada = await signUp("Ada");
    const owner = await workspaceContext(ada.userId, ada.personalWorkspaceId);
    const invitation = await inviteMember(owner, ada.requestHeaders, {
      email: "bob@example.com",
      role: "member",
    });
    if (!invitation.ok) throw new Error(invitation.error);
    const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    expect((await getInvitationPreview(invitation.invitationId, inTwoWeeks))?.status).toBe(
      "expired",
    );
    expect(await getInvitationPreview("unknown")).toBeNull();
  });
});
