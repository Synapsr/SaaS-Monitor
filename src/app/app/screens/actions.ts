"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { invalidInput, type ActionResult } from "@/lib/action-result";
import {
  createScreen,
  deleteScreen,
  newScreenSchema,
  regenerateScreenToken,
  screenInputSchema,
  sendTestEvent,
  updateScreen,
} from "@/server/screens";
import { requireWorkspace } from "@/server/session";

const screenIdSchema = z.uuid();

export async function createScreenAction(
  input: z.input<typeof newScreenSchema>,
): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = newScreenSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await createScreen(workspace.id, parsed.data);
  if (!result.ok) return result;
  revalidatePath("/app", "layout");
  redirect(`/app/screens/${result.screenId}`);
}

/** Auto-save of the screen editor: the whole screen, validated like any other input. */
export async function saveScreenAction(
  screenId: string,
  input: z.input<typeof screenInputSchema>,
): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = z.object({ screenId: screenIdSchema, input: screenInputSchema }).safeParse({
    screenId,
    input,
  });
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await updateScreen(workspace.id, parsed.data.screenId, parsed.data.input);
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}

export async function regenerateScreenLinkAction(
  screenId: string,
): Promise<ActionResult<{ publicToken: string }>> {
  const { workspace } = await requireWorkspace();
  const parsed = screenIdSchema.safeParse(screenId);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await regenerateScreenToken(workspace.id, parsed.data);
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}

export async function sendTestCelebrationAction(screenId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = screenIdSchema.safeParse(screenId);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await sendTestEvent(workspace.id, parsed.data);
  return result.ok ? { ok: true } : result;
}

export async function deleteScreenAction(screenId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = screenIdSchema.safeParse(screenId);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await deleteScreen(workspace.id, parsed.data);
  if (!result.ok) return result;
  revalidatePath("/app", "layout");
  redirect("/app/screens");
}
