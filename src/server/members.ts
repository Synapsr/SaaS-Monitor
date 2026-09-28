import "server-only";
import { isAPIError } from "better-auth/api";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { invitations, members, organizations, users } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/server/auth";
import type { WorkspaceContext } from "@/server/session";
import type { WorkspaceRole } from "@/server/workspaces";

// Membership changes go through Better Auth's organization API, which enforces its own access
// control. The checks below come first to explain refusals clearly, and every call passes the
// workspace resolved by `requireWorkspace()` explicitly instead of trusting the session's
// "active organization", which can lag behind (see `requireWorkspace`).

export const WORKSPACE_ROLES = ["owner", "admin", "member"] as const;

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: Date;
}

export interface InvitationPreview {
  id: string;
  email: string;
  role: WorkspaceRole;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  /** Only `pending` invitations can be accepted. */
  status: "pending" | "accepted" | "expired" | "revoked";
}

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  role: z.enum(WORKSPACE_ROLES),
});

const NOT_ALLOWED = { ok: false, error: "Only owners and admins can manage members." } as const;

/** Owners and admins manage people; members use the workspace. */
export function canManageMembers(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

/** Better Auth stores multiple roles comma-separated: the highest one wins. */
export function parseRole(role: string | null): WorkspaceRole {
  const roles = (role ?? "").split(",").map((value) => value.trim());
  return WORKSPACE_ROLES.find((candidate) => roles.includes(candidate)) ?? "member";
}

const ROLE_ORDER: Record<WorkspaceRole, number> = { owner: 0, admin: 1, member: 2 };

const AUTH_ERRORS: Record<string, string> = {
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION:
    "This person is already a member of the workspace.",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE: "Only owners can invite other owners.",
  INVITATION_LIMIT_REACHED: "Too many pending invitations. Revoke a few before inviting more.",
  ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: "This workspace has reached its member limit.",
  INVITATION_NOT_FOUND: "This invitation has expired or was revoked.",
  YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION: "This invitation was sent to another email address.",
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER:
    "A workspace needs an owner. Invite another owner first, or delete the workspace.",
  MEMBER_NOT_FOUND: "This person is not a member of the workspace anymore.",
};

/** Turns a refusal of Better Auth into a readable result; anything else is a bug and is rethrown. */
export function authFailure(error: unknown): { ok: false; error: string } {
  if (!isAPIError(error)) throw error;
  const { code, message } = error.body ?? {};
  return {
    ok: false,
    error:
      (typeof code === "string" && AUTH_ERRORS[code]) ||
      (typeof message === "string" && message) ||
      "Something went wrong. Please try again.",
  };
}

export async function listMembers(
  context: WorkspaceContext,
  requestHeaders: Headers,
): Promise<WorkspaceMember[]> {
  const { members: rows } = await auth().api.listMembers({
    headers: requestHeaders,
    query: { organizationId: context.workspace.id },
  });
  return rows
    .map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image ?? null,
      role: parseRole(member.role),
      joinedAt: new Date(member.createdAt),
    }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || +a.joinedAt - +b.joinedAt);
}

export async function listPendingInvitations(
  context: WorkspaceContext,
  requestHeaders: Headers,
): Promise<PendingInvitation[]> {
  const rows = await auth().api.listInvitations({
    headers: requestHeaders,
    query: { organizationId: context.workspace.id },
  });
  const now = Date.now();
  // An invitation link grants its role to whoever signs up with the invited address (emails are
  // not verified), so only owners may see the links that make someone an owner.
  const isVisible = (role: WorkspaceRole) => context.role === "owner" || role !== "owner";
  return rows
    .filter(({ status, expiresAt }) => status === "pending" && new Date(expiresAt).getTime() > now)
    .map(({ id, email, role, expiresAt }) => ({
      id,
      email,
      role: parseRole(role),
      expiresAt: new Date(expiresAt),
    }))
    .filter((invitation) => isVisible(invitation.role))
    .sort((a, b) => +b.expiresAt - +a.expiresAt);
}

/**
 * Creates an invitation to share as a link (no email is sent). Inviting the same address again
 * returns the pending invitation with a fresh expiry, so a lost link can simply be recreated.
 */
export async function inviteMember(
  context: WorkspaceContext,
  requestHeaders: Headers,
  input: z.infer<typeof inviteSchema>,
): Promise<ActionResult<{ invitationId: string }>> {
  if (!canManageMembers(context.role)) return NOT_ALLOWED;
  if (input.role === "owner" && context.role !== "owner") {
    return { ok: false, error: AUTH_ERRORS.YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE };
  }
  try {
    const invitation = await auth().api.createInvitation({
      headers: requestHeaders,
      body: {
        email: input.email,
        role: input.role,
        organizationId: context.workspace.id,
        resend: true,
      },
    });
    return { ok: true, invitationId: invitation.id };
  } catch (error) {
    return authFailure(error);
  }
}

export async function revokeInvitation(
  context: WorkspaceContext,
  requestHeaders: Headers,
  invitationId: string,
): Promise<ActionResult> {
  if (!canManageMembers(context.role)) return NOT_ALLOWED;
  // Better Auth only checks that the caller may cancel invitations in the invitation's own
  // workspace: make sure it belongs to the current one.
  const [invitation] = await db()
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(eq(invitations.id, invitationId), eq(invitations.organizationId, context.workspace.id)),
    );
  if (!invitation) return { ok: false, error: AUTH_ERRORS.INVITATION_NOT_FOUND };
  try {
    await auth().api.cancelInvitation({ headers: requestHeaders, body: { invitationId } });
    return { ok: true };
  } catch (error) {
    return authFailure(error);
  }
}

export async function removeMember(
  context: WorkspaceContext,
  requestHeaders: Headers,
  memberId: string,
): Promise<ActionResult> {
  if (!canManageMembers(context.role)) return NOT_ALLOWED;
  const [member] = await db()
    .select({ userId: members.userId, role: members.role })
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.organizationId, context.workspace.id)));
  if (!member) return { ok: false, error: AUTH_ERRORS.MEMBER_NOT_FOUND };
  if (member.userId === context.user.id) {
    return { ok: false, error: "To remove yourself, leave the workspace instead." };
  }
  if (parseRole(member.role) === "owner" && context.role !== "owner") {
    return { ok: false, error: "Only owners can remove another owner." };
  }
  try {
    await auth().api.removeMember({
      headers: requestHeaders,
      body: { memberIdOrEmail: memberId, organizationId: context.workspace.id },
    });
    return { ok: true };
  } catch (error) {
    return authFailure(error);
  }
}

/** Leaves the current workspace. The caller should then switch to another one. */
export async function leaveWorkspace(
  context: WorkspaceContext,
  requestHeaders: Headers,
): Promise<ActionResult> {
  try {
    await auth().api.leaveOrganization({
      headers: requestHeaders,
      body: { organizationId: context.workspace.id },
    });
    return { ok: true };
  } catch (error) {
    return authFailure(error);
  }
}

/**
 * What the invitation page shows before anyone signs in. The invitation id is an unguessable
 * secret shared by the inviter, so holding it is enough to see who invited whom, and where.
 */
export async function getInvitationPreview(
  invitationId: string,
  now: Date = new Date(),
): Promise<InvitationPreview | null> {
  const [row] = await db()
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      workspaceId: organizations.id,
      workspaceName: organizations.name,
      inviterName: users.name,
    })
    .from(invitations)
    .innerJoin(organizations, eq(organizations.id, invitations.organizationId))
    .innerJoin(users, eq(users.id, invitations.inviterId))
    .where(eq(invitations.id, invitationId))
    .limit(1);
  if (!row) return null;

  const status =
    row.status === "accepted"
      ? "accepted"
      : row.status !== "pending"
        ? "revoked"
        : row.expiresAt <= now
          ? "expired"
          : "pending";
  return { ...row, role: parseRole(row.role), status };
}

/** Joins the invitation's workspace and makes it the active one. */
export async function acceptInvitation(
  requestHeaders: Headers,
  invitationId: string,
): Promise<ActionResult<{ workspaceId: string }>> {
  try {
    const { invitation } = await auth().api.acceptInvitation({
      headers: requestHeaders,
      body: { invitationId },
    });
    // Accepting only updates the session row; this also refreshes the session cookie cache.
    await auth().api.setActiveOrganization({
      headers: requestHeaders,
      body: { organizationId: invitation.organizationId },
    });
    return { ok: true, workspaceId: invitation.organizationId };
  } catch (error) {
    return authFailure(error);
  }
}
