"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { acceptInvitation } from "@/server/members";
import { requireSession } from "@/server/session";

/** Joins the invited workspace and opens it. Better Auth checks the invitation's email. */
export async function acceptInvitationAction(invitationId: string): Promise<ActionResult> {
  await requireSession();
  const parsed = z.string().min(1).max(100).safeParse(invitationId);
  if (!parsed.success) return { ok: false, error: "This invitation link is incomplete." };

  const result = await acceptInvitation(await headers(), parsed.data);
  if (!result.ok) return result;
  revalidatePath("/app", "layout");
  redirect("/app");
}
