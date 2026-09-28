import "server-only";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { members, organizations, stripeAccounts } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/server/auth";
import { authFailure, parseRole } from "@/server/members";
import type { WorkspaceContext } from "@/server/session";
import { disconnectStripeAccount } from "@/server/stripe/accounts";
import { ensureWorkspace, type WorkspaceRole } from "@/server/workspaces";

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Give the workspace a name.")
  .max(60, "Keep the name under 60 characters.");

export interface UserWorkspace {
  id: string;
  name: string;
  role: WorkspaceRole;
}

/** Workspaces the user belongs to, in the order they joined them. */
export async function listUserWorkspaces(userId: string): Promise<UserWorkspace[]> {
  const rows = await db()
    .select({ id: organizations.id, name: organizations.name, role: members.role })
    .from(members)
    .innerJoin(organizations, eq(organizations.id, members.organizationId))
    .where(eq(members.userId, userId))
    .orderBy(asc(members.createdAt));
  return rows.map((row) => ({ ...row, role: parseRole(row.role) }));
}

/**
 * Makes `workspaceId` the active workspace. Better Auth checks the membership and also refreshes
 * the session cookie cache, which would otherwise keep the previous workspace for a few minutes.
 */
export async function switchWorkspace(
  requestHeaders: Headers,
  workspaceId: string,
): Promise<ActionResult> {
  try {
    await auth().api.setActiveOrganization({
      headers: requestHeaders,
      body: { organizationId: workspaceId },
    });
    return { ok: true };
  } catch (error) {
    return authFailure(error);
  }
}

/** After leaving or deleting a workspace: back to the first one joined, or a new personal one. */
export async function activateDefaultWorkspace(userId: string, requestHeaders: Headers) {
  const workspaceId = await ensureWorkspace(userId);
  return switchWorkspace(requestHeaders, workspaceId);
}

export async function createWorkspace(
  requestHeaders: Headers,
  name: string,
): Promise<ActionResult<{ workspaceId: string }>> {
  const parsed = workspaceNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const workspace = await auth().api.createOrganization({
      headers: requestHeaders,
      // Better Auth requires a unique slug; the app never shows it.
      body: { name: parsed.data, slug: crypto.randomUUID() },
    });
    const switched = await switchWorkspace(requestHeaders, workspace.id);
    return switched.ok ? { ok: true, workspaceId: workspace.id } : switched;
  } catch (error) {
    return authFailure(error);
  }
}

export async function renameWorkspace(
  context: WorkspaceContext,
  requestHeaders: Headers,
  name: string,
): Promise<ActionResult> {
  if (context.role === "member") {
    return { ok: false, error: "Only owners and admins can rename the workspace." };
  }
  const parsed = workspaceNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await auth().api.updateOrganization({
      headers: requestHeaders,
      body: { organizationId: context.workspace.id, data: { name: parsed.data } },
    });
    return { ok: true };
  } catch (error) {
    return authFailure(error);
  }
}

/**
 * Deletes the workspace with its screens and Stripe connections, then moves the user to another
 * workspace (a brand new one if it was their only workspace).
 */
export async function deleteWorkspace(
  context: WorkspaceContext,
  requestHeaders: Headers,
): Promise<ActionResult> {
  if (context.role !== "owner") {
    return { ok: false, error: "Only owners can delete the workspace." };
  }
  // Rows would be removed by cascade, but disconnecting also deletes the webhook endpoints the app
  // registered in Stripe.
  const accounts = await db()
    .select({ id: stripeAccounts.id })
    .from(stripeAccounts)
    .where(eq(stripeAccounts.workspaceId, context.workspace.id));
  for (const account of accounts) await disconnectStripeAccount(context.workspace.id, account.id);

  try {
    await auth().api.deleteOrganization({
      headers: requestHeaders,
      body: { organizationId: context.workspace.id },
    });
  } catch (error) {
    return authFailure(error);
  }
  return activateDefaultWorkspace(context.user.id, requestHeaders);
}
