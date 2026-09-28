"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireWorkspace } from "@/server/session";
import { createWorkspace, switchWorkspace } from "@/server/workspace-admin";

export async function switchWorkspaceAction(workspaceId: string): Promise<ActionResult> {
  await requireWorkspace();
  const parsed = z.string().min(1).max(100).safeParse(workspaceId);
  if (!parsed.success) return { ok: false, error: "Unknown workspace." };

  const result = await switchWorkspace(await headers(), parsed.data);
  if (!result.ok) return result;
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function createWorkspaceAction(input: { name: string }): Promise<ActionResult> {
  await requireWorkspace();
  const parsed = z.object({ name: z.string().max(200) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Give the workspace a name." };

  const result = await createWorkspace(await headers(), parsed.data.name);
  if (!result.ok) return result;
  revalidatePath("/app", "layout");
  redirect("/app");
}
