"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/server/auth";
import {
  authFailure,
  inviteMember,
  inviteSchema,
  leaveWorkspace,
  removeMember,
  revokeInvitation,
} from "@/server/members";
import { requireWorkspace } from "@/server/session";
import {
  activateDefaultWorkspace,
  deleteWorkspace,
  renameWorkspace,
} from "@/server/workspace-admin";

const idSchema = z.string().min(1).max(100);

function invalid(error: z.ZodError): { ok: false; error: string } {
  return { ok: false, error: error.issues[0]?.message ?? "Some values are invalid." };
}

export async function renameWorkspaceAction(name: string): Promise<ActionResult> {
  const context = await requireWorkspace();
  const parsed = z.string().max(200).safeParse(name);
  if (!parsed.success) return invalid(parsed.error);

  const result = await renameWorkspace(context, await headers(), parsed.data);
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}

export async function inviteMemberAction(
  input: z.input<typeof inviteSchema>,
): Promise<ActionResult<{ invitationId: string }>> {
  const context = await requireWorkspace();
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const result = await inviteMember(context, await headers(), parsed.data);
  if (result.ok) revalidatePath("/app/settings");
  return result;
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  const context = await requireWorkspace();
  const parsed = idSchema.safeParse(invitationId);
  if (!parsed.success) return invalid(parsed.error);

  const result = await revokeInvitation(context, await headers(), parsed.data);
  if (result.ok) revalidatePath("/app/settings");
  return result;
}

export async function removeMemberAction(memberId: string): Promise<ActionResult> {
  const context = await requireWorkspace();
  const parsed = idSchema.safeParse(memberId);
  if (!parsed.success) return invalid(parsed.error);

  const result = await removeMember(context, await headers(), parsed.data);
  if (result.ok) revalidatePath("/app/settings");
  return result;
}

export async function leaveWorkspaceAction(): Promise<ActionResult> {
  const context = await requireWorkspace();
  const requestHeaders = await headers();

  const result = await leaveWorkspace(context, requestHeaders);
  if (!result.ok) return result;
  await activateDefaultWorkspace(context.user.id, requestHeaders);
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function deleteWorkspaceAction(): Promise<ActionResult> {
  const context = await requireWorkspace();

  const result = await deleteWorkspace(context, await headers());
  if (!result.ok) return result;
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function updateProfileAction(name: string): Promise<ActionResult> {
  await requireWorkspace();
  const parsed = z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Keep your name under 100 characters.")
    .safeParse(name);
  if (!parsed.success) return invalid(parsed.error);

  try {
    await auth().api.updateUser({ headers: await headers(), body: { name: parsed.data } });
  } catch (error) {
    return authFailure(error);
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}
